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
    refetch,
  };
}

