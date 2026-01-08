import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Item } from "../types";

export function useItems(wishlistId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishlistId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("items")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching items:", fetchError);
        setError(fetchError.message);
        setItems([]);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    };

    fetchItems();
  }, [wishlistId]);

  const createItem = async (itemData: {
    url: string;
    store: string;
    name: string | null;
    price: number | null;
    notes: string | null;
    tags: string[];
    status: "considering" | "bought" | "dropped";
    decision_reason: string | null;
    image_url: string | null;
    user_id: string;
    wishlist_id: string;
  }) => {
    const { data, error: createError } = await supabase
      .from("items")
      .insert([itemData])
      .select()
      .single();

    if (createError) {
      console.error("Error creating item:", createError);
      throw createError;
    }

    if (data) {
      setItems((prev) => [data as Item, ...prev]);
    }

    return data as Item;
  };

  const updateItem = async (updatedItem: Item) => {
    const tagsArray = Array.isArray(updatedItem.tags) ? updatedItem.tags : [];

    const updateData = {
      store: updatedItem.store,
      name: updatedItem.name || null,
      price: updatedItem.price,
      notes: updatedItem.notes || null,
      tags: tagsArray,
      status: updatedItem.status,
      decision_reason:
        updatedItem.status !== "considering" && updatedItem.decision_reason
          ? updatedItem.decision_reason
          : null,
      image_url: updatedItem.image_url || null,
    };

    const { error: updateError } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", updatedItem.id);

    if (updateError) {
      console.error("Error updating item:", updateError);
      throw updateError;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const deleteItem = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting item:", deleteError);
      throw deleteError;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const refetch = async () => {
    if (!wishlistId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("items")
      .select("*")
      .eq("wishlist_id", wishlistId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      setError(fetchError.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetch,
  };
}

