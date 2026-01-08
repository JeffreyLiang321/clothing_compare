import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { WishlistShare } from "../types";

export function useWishlistShares(wishlistId: string | null, ownerId: string | null) {
  const [shares, setShares] = useState<WishlistShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishlistId || !ownerId) {
      setShares([]);
      setLoading(false);
      return;
    }

    const fetchShares = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching shares:", fetchError);
        setError(fetchError.message);
        setShares([]);
      } else {
        setShares(data || []);
      }

      setLoading(false);
    };

    fetchShares();
  }, [wishlistId, ownerId]);

  const createShare = async (data: {
    wishlist_id: string;
    owner_id: string;
    owner_email: string;
    shared_with_email: string;
  }) => {
    const { data: shareData, error: createError } = await supabase
      .from("wishlist_shares")
      .insert([data])
      .select()
      .single();

    if (createError) {
      console.error("Error creating share:", createError);
      throw createError;
    }

    if (shareData) {
      setShares((prev) => [shareData as WishlistShare, ...prev]);
    }

    return shareData as WishlistShare;
  };

  const deleteShare = async (shareId: string) => {
    const { error: deleteError } = await supabase
      .from("wishlist_shares")
      .delete()
      .eq("id", shareId)
      .eq("wishlist_id", wishlistId)
      .eq("owner_id", ownerId);

    if (deleteError) {
      console.error("Error deleting share:", deleteError);
      throw deleteError;
    }

    setShares((prev) => prev.filter((share) => share.id !== shareId));
  };

  const getSharesByEmail = async (email: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .ilike("shared_with_email", email);

    if (fetchError) {
      console.error("Error fetching shares by email:", fetchError);
      throw fetchError;
    }

    return (data || []) as WishlistShare[];
  };

  const getShareByWishlistAndEmail = async (wishlistId: string, email: string) => {
    const { data, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .ilike("shared_with_email", email)
      .single();

    if (fetchError) {
      console.error("Error fetching share:", fetchError);
      throw fetchError;
    }

    return data as WishlistShare;
  };

  const refetch = async () => {
    if (!wishlistId || !ownerId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("wishlist_shares")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching shares:", fetchError);
      setError(fetchError.message);
    } else {
      setShares(data || []);
    }

    setLoading(false);
  };

  return {
    shares,
    loading,
    error,
    createShare,
    deleteShare,
    getSharesByEmail,
    getShareByWishlistAndEmail,
    refetch,
  };
}

