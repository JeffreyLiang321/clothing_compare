import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Wishlist } from "../types";

export function useWishlists(userId: string | null) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setWishlists([]);
      setLoading(false);
      return;
    }

    const fetchWishlists = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching wishlists:", fetchError);
        setError(fetchError.message);
        setWishlists([]);
      } else {
        setWishlists(data || []);
      }

      setLoading(false);
    };

    fetchWishlists();
  }, [userId]);

  const createWishlist = async (name: string) => {
    if (!userId) throw new Error("User ID is required");

    const shareToken = crypto.randomUUID();
    const { data, error: createError } = await supabase
      .from("wishlists")
      .insert([
        {
          user_id: userId,
          name: name.trim(),
          is_public: false,
          share_token: shareToken,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating wishlist:", createError);
      throw createError;
    }

    if (data) {
      setWishlists((prev) => [...prev, data as Wishlist]);
    }

    return data as Wishlist;
  };

  const getWishlist = async (wishlistId: string, userId: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlists")
      .select("*")
      .eq("id", wishlistId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching wishlist:", fetchError);
      throw fetchError;
    }

    return data as Wishlist;
  };

  const getWishlistByToken = async (token: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlists")
      .select("*")
      .eq("share_token", token)
      .eq("is_public", true)
      .single();

    if (fetchError) {
      console.error("Error fetching wishlist by token:", fetchError);
      throw fetchError;
    }

    return data as Wishlist;
  };

  const getWishlistById = async (wishlistId: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlists")
      .select("*")
      .eq("id", wishlistId)
      .single();

    if (fetchError) {
      console.error("Error fetching wishlist by ID:", fetchError);
      throw fetchError;
    }

    return data as Wishlist;
  };

  const renameWishlist = async (wishlistId: string, newName: string) => {
    if (!userId) throw new Error("User ID is required");

    // Validate: trim and check non-empty
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error("Cart name cannot be empty");
    }

    // Find the current wishlist
    const currentWishlist = wishlists.find((w) => w.id === wishlistId);
    if (!currentWishlist) {
      throw new Error("Wishlist not found");
    }

    // Check if unchanged (case-insensitive comparison)
    if (currentWishlist.name.trim().toLowerCase() === trimmedName.toLowerCase()) {
      // No change, return early
      return currentWishlist;
    }

    // Check for case-insensitive duplicates (excluding current wishlist)
    const normalizedNewName = trimmedName.toLowerCase();
    const duplicate = wishlists.find(
      (w) =>
        w.id !== wishlistId &&
        w.name.trim().toLowerCase() === normalizedNewName
    );

    if (duplicate) {
      throw new Error(`A cart named "${trimmedName}" already exists`);
    }

    // Optimistic update: update local state immediately
    const previousWishlists = [...wishlists];
    setWishlists((prev) =>
      prev.map((w) =>
        w.id === wishlistId ? { ...w, name: trimmedName } : w
      )
    );

    try {
      // Update in database
      const { data, error: updateError } = await supabase
        .from("wishlists")
        .update({ name: trimmedName })
        .eq("id", wishlistId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        // Rollback optimistic update on error
        setWishlists(previousWishlists);

        // Check if it's a unique constraint violation
        if (updateError.code === "23505" || updateError.message.includes("unique")) {
          throw new Error(`A cart named "${trimmedName}" already exists`);
        }

        console.error("Error renaming wishlist:", updateError);
        throw updateError;
      }

      // Update with the actual data from database
      if (data) {
        setWishlists((prev) =>
          prev.map((w) => (w.id === wishlistId ? (data as Wishlist) : w))
        );
        return data as Wishlist;
      }

      return currentWishlist;
    } catch (error: any) {
      // Rollback optimistic update on any error
      setWishlists(previousWishlists);
      throw error;
    }
  };

  const refetch = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching wishlists:", fetchError);
      setError(fetchError.message);
    } else {
      setWishlists(data || []);
    }

    setLoading(false);
  };

  return {
    wishlists,
    loading,
    error,
    createWishlist,
    getWishlist,
    getWishlistByToken,
    getWishlistById,
    renameWishlist,
    refetch,
  };
}

