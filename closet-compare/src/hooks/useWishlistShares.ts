import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { WishlistShare } from "../types";

export function useWishlistShares(wishlistId: string | null, ownerUserId: string | null) {
  const [shares, setShares] = useState<WishlistShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishlistId || !ownerUserId) {
      setShares([]);
      setLoading(false);
      return;
    }

    const fetchShares = async () => {
      setLoading(true);
      setError(null);

      // Fetch shares and join with profiles to get usernames
      const { data: sharesData, error: fetchError } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .eq("owner_user_id", ownerUserId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching shares:", fetchError);
        setError(fetchError.message);
        setShares([]);
      } else {
        // Fetch usernames for owner and recipients
        const userIds = new Set<string>();
        (sharesData || []).forEach((share: any) => {
          if (share.owner_user_id) userIds.add(share.owner_user_id);
          if (share.recipient_user_id) userIds.add(share.recipient_user_id);
        });

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(userIds));

        const profilesMap = new Map(
          (profilesData || []).map((p: any) => [p.id, p.username])
        );

        // Transform the data to include usernames
        const transformedShares = (sharesData || []).map((share: any) => ({
          ...share,
          owner_username: profilesMap.get(share.owner_user_id),
          recipient_username: profilesMap.get(share.recipient_user_id),
        }));
        setShares(transformedShares as WishlistShare[]);
      }

      setLoading(false);
    };

    fetchShares();
  }, [wishlistId, ownerUserId]);

  const createShare = async (data: {
    wishlist_id: string;
    owner_user_id: string;
    recipient_user_id: string;
  }) => {
    const { data: shareData, error: createError } = await supabase
      .from("wishlist_shares")
      .insert([
        {
          wishlist_id: data.wishlist_id,
          owner_user_id: data.owner_user_id,
          recipient_user_id: data.recipient_user_id,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating share:", createError);
      // Provide user-friendly error messages
      if (createError.code === "23502") {
        throw new Error("Failed to create share: missing required field");
      } else if (createError.code === "23505") {
        throw new Error("Wishlist is already shared with this user");
      }
      throw new Error(createError.message || "Failed to share wishlist");
    }

    if (shareData) {
      // Fetch usernames for the new share
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", [shareData.owner_user_id, shareData.recipient_user_id]);

      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [p.id, p.username])
      );

      const transformedShare = {
        ...shareData,
        owner_username: profilesMap.get(shareData.owner_user_id),
        recipient_username: profilesMap.get(shareData.recipient_user_id),
      };
      setShares((prev) => [transformedShare as WishlistShare, ...prev]);
      return transformedShare as WishlistShare;
    }

    return shareData as WishlistShare;
  };

  const deleteShare = async (shareId: string) => {
    const { error: deleteError } = await supabase
      .from("wishlist_shares")
      .delete()
      .eq("id", shareId)
      .eq("wishlist_id", wishlistId)
      .eq("owner_user_id", ownerUserId);

    if (deleteError) {
      console.error("Error deleting share:", deleteError);
      throw deleteError;
    }

    setShares((prev) => prev.filter((share) => share.id !== shareId));
  };

  const getSharesByUserId = async (userId: string) => {
    const { data: sharesData, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .eq("recipient_user_id", userId);

    if (fetchError) {
      console.error("Error fetching shares by user ID:", fetchError);
      throw fetchError;
    }

    // Fetch usernames for owners
    const ownerIds = new Set<string>();
    (sharesData || []).forEach((share: any) => {
      if (share.owner_user_id) ownerIds.add(share.owner_user_id);
    });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", Array.from(ownerIds));

    const profilesMap = new Map(
      (profilesData || []).map((p: any) => [p.id, p.username])
    );

    // Transform the data to include usernames
    const transformedShares = (sharesData || []).map((share: any) => ({
      ...share,
      owner_username: profilesMap.get(share.owner_user_id),
      recipient_username: profilesMap.get(share.recipient_user_id),
    }));

    return transformedShares as WishlistShare[];
  };

  const getShareByWishlistAndUserId = async (wishlistId: string, userId: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .eq("recipient_user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching share:", fetchError);
      throw fetchError;
    }

    // Fetch usernames
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", [data.owner_user_id, data.recipient_user_id]);

    const profilesMap = new Map(
      (profilesData || []).map((p: any) => [p.id, p.username])
    );

    const transformedShare = {
      ...data,
      owner_username: profilesMap.get(data.owner_user_id),
      recipient_username: profilesMap.get(data.recipient_user_id),
    };

    return transformedShare as WishlistShare;
  };

  const refetch = async () => {
    if (!wishlistId || !ownerUserId) return;

    setLoading(true);
    setError(null);

    const { data: sharesData, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching shares:", fetchError);
      setError(fetchError.message);
    } else {
      // Fetch usernames
      const userIds = new Set<string>();
      (sharesData || []).forEach((share: any) => {
        if (share.owner_user_id) userIds.add(share.owner_user_id);
        if (share.recipient_user_id) userIds.add(share.recipient_user_id);
      });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", Array.from(userIds));

      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [p.id, p.username])
      );

      // Transform the data to include usernames
      const transformedShares = (sharesData || []).map((share: any) => ({
        ...share,
        owner_username: profilesMap.get(share.owner_user_id),
        recipient_username: profilesMap.get(share.recipient_user_id),
      }));
      setShares(transformedShares as WishlistShare[]);
    }

    setLoading(false);
  };

  return {
    shares,
    loading,
    error,
    createShare,
    deleteShare,
    getSharesByUserId,
    getShareByWishlistAndUserId,
    refetch,
  };
}

