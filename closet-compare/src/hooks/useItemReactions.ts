import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type ItemReaction = {
  item_id: string;
  user_id: string;
  reaction: 1 | -1;
};

export type ItemScore = {
  item_id: string;
  score: number;
  likes: number;
  dislikes: number;
};

export function useItemReactions(itemIds: string[], userId: string | null) {
  const [reactions, setReactions] = useState<Record<string, 1 | -1>>({});
  const [scores, setScores] = useState<Record<string, ItemScore>>({});
  const [loading, setLoading] = useState(false);

  // Fetch user's reactions for the given items
  const fetchUserReactions = useCallback(async () => {
    if (!userId || itemIds.length === 0) {
      setReactions({});
      return;
    }

    const { data, error } = await supabase
      .from("item_reactions")
      .select("item_id, reaction")
      .eq("user_id", userId)
      .in("item_id", itemIds);

    if (error) {
      console.error("Error fetching user reactions:", error);
      return;
    }

    const reactionsMap: Record<string, 1 | -1> = {};
    data?.forEach((row) => {
      reactionsMap[row.item_id] = row.reaction as 1 | -1;
    });
    setReactions(reactionsMap);
  }, [userId, itemIds.join(",")]);

  // Fetch batched item scores
  const fetchItemScores = useCallback(async () => {
    if (itemIds.length === 0) {
      setScores({});
      return;
    }

    const { data, error } = await supabase.rpc("get_item_scores", {
      item_ids: itemIds,
    });

    if (error) {
      console.error("Error fetching item scores:", error);
      return;
    }

    const scoresMap: Record<string, ItemScore> = {};
    data?.forEach((row: ItemScore) => {
      scoresMap[row.item_id] = row;
    });
    setScores(scoresMap);
  }, [itemIds.join(",")]);

  // Initial fetch
  useEffect(() => {
    if (itemIds.length === 0) {
      setReactions({});
      setScores({});
      return;
    }

    setLoading(true);
    Promise.all([fetchUserReactions(), fetchItemScores()]).finally(() => {
      setLoading(false);
    });
  }, [fetchUserReactions, fetchItemScores]);

  // Upsert or delete reaction
  const toggleReaction = useCallback(
    async (itemId: string, reaction: 1 | -1) => {
      if (!userId) {
        console.error("User must be authenticated to react");
        return;
      }

      const currentReaction = reactions[itemId];
      const isSameReaction = currentReaction === reaction;

      // Optimistic update
      const previousReaction = reactions[itemId];
      const previousScore = scores[itemId];

      if (isSameReaction) {
        // Remove reaction (delete)
        setReactions((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
        setScores((prev) => {
          const current = prev[itemId];
          if (!current) return prev;
          return {
            ...prev,
            [itemId]: {
              ...current,
              score: current.score - reaction,
              likes: reaction === 1 ? current.likes - 1 : current.likes,
              dislikes: reaction === -1 ? current.dislikes - 1 : current.dislikes,
            },
          };
        });
      } else {
        // Update or insert reaction
        const newReaction = reaction;
        setReactions((prev) => ({ ...prev, [itemId]: newReaction }));
        setScores((prev) => {
          const current = prev[itemId];
          if (!current) {
            // If score doesn't exist yet, create it optimistically
            return {
              ...prev,
              [itemId]: {
                item_id: itemId,
                score: reaction,
                likes: reaction === 1 ? 1 : 0,
                dislikes: reaction === -1 ? 1 : 0,
              },
            };
          }

          // Adjust score based on previous reaction
          let scoreDelta = reaction;
          let likesDelta = reaction === 1 ? 1 : 0;
          let dislikesDelta = reaction === -1 ? 1 : 0;

          if (previousReaction === 1) {
            scoreDelta -= 1;
            likesDelta -= 1;
          } else if (previousReaction === -1) {
            scoreDelta += 1;
            dislikesDelta -= 1;
          }

          return {
            ...prev,
            [itemId]: {
              ...current,
              score: current.score + scoreDelta,
              likes: current.likes + likesDelta,
              dislikes: current.dislikes + dislikesDelta,
            },
          };
        });
      }

      try {
        if (isSameReaction) {
          // Delete reaction
          const { error } = await supabase
            .from("item_reactions")
            .delete()
            .eq("item_id", itemId)
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          // Upsert reaction
          const { error } = await supabase
            .from("item_reactions")
            .upsert(
              {
                item_id: itemId,
                user_id: userId,
                reaction,
              },
              {
                onConflict: "item_id,user_id",
              }
            );

          if (error) throw error;
        }

        // Refetch scores to reconcile with server
        await fetchItemScores();
      } catch (error) {
        console.error("Error toggling reaction:", error);
        // Revert optimistic update
        setReactions((prev) => {
          if (previousReaction === undefined) {
            const next = { ...prev };
            delete next[itemId];
            return next;
          }
          return { ...prev, [itemId]: previousReaction };
        });
        if (previousScore) {
          setScores((prev) => ({ ...prev, [itemId]: previousScore }));
        } else {
          setScores((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
        }
      }
    },
    [userId, reactions, scores, fetchItemScores]
  );

  return {
    reactions,
    scores,
    loading,
    toggleReaction,
    refetch: () => {
      return Promise.all([fetchUserReactions(), fetchItemScores()]);
    },
  };
}

