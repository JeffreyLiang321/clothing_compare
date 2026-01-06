import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Wishlist } from "../types";

const ACTIVE_WISHLIST_KEY = "activeWishlistId";

type Props = {
  onWishlistChange?: (wishlistId: string) => void;
};

export default function WishlistSelector({ onWishlistChange }: Props) {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [creating, setCreating] = useState(false);
  const onWishlistChangeRef = useRef(onWishlistChange);
  const hasLoadedRef = useRef<string | null>(null);

  // Keep the callback ref updated without causing re-renders
  useEffect(() => {
    onWishlistChangeRef.current = onWishlistChange;
  }, [onWishlistChange]);

  useEffect(() => {
    const loadWishlists = async () => {
      if (!user) {
        setLoading(false);
        hasLoadedRef.current = null;
        return;
      }

      // Only fetch once per user
      if (hasLoadedRef.current === user.id) {
        return;
      }

      setLoading(true);
      hasLoadedRef.current = user.id;

      const { data: wishlistsData, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching wishlists:", error);
        setLoading(false);
        hasLoadedRef.current = null;
        return;
      }

      let wishlistsList = wishlistsData || [];

      if (wishlistsList.length === 0) {
        const shareToken = crypto.randomUUID();
        const { data: newWishlist, error: createError } = await supabase
          .from("wishlists")
          .insert([
            {
              user_id: user.id,
              name: "My Wishlist",
              is_public: false,
              share_token: shareToken,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating default wishlist:", createError);
          setLoading(false);
          hasLoadedRef.current = null;
          return;
        }

        wishlistsList = [newWishlist as Wishlist];
      }

      setWishlists(wishlistsList);

      const storedId = localStorage.getItem(ACTIVE_WISHLIST_KEY);
      let activeId = storedId;

      if (!storedId || !wishlistsList.find((w) => w.id === storedId)) {
        activeId = wishlistsList[0].id;
        localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
      }

      setActiveWishlistId(activeId);
      if (onWishlistChangeRef.current && activeId) {
        onWishlistChangeRef.current(activeId);
      }

      setLoading(false);
    };

    loadWishlists();
  }, [user]);

  const handleWishlistChange = (wishlistId: string) => {
    if (wishlistId === "new") {
      setShowCreateModal(true);
      return;
    }

    setActiveWishlistId(wishlistId);
    localStorage.setItem(ACTIVE_WISHLIST_KEY, wishlistId);
    if (onWishlistChangeRef.current) {
      onWishlistChangeRef.current(wishlistId);
    }
  };

  const handleCreateCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCartName.trim()) return;

    setCreating(true);
    const shareToken = crypto.randomUUID();
    const { data: newWishlist, error } = await supabase
      .from("wishlists")
      .insert([
        {
          user_id: user.id,
          name: newCartName.trim(),
          is_public: false,
          share_token: shareToken,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating wishlist:", error);
      alert("Failed to create cart");
      setCreating(false);
      return;
    }

    const updatedWishlists = [...wishlists, newWishlist as Wishlist];
    setWishlists(updatedWishlists);
    setNewCartName("");
    setShowCreateModal(false);

    const newId = (newWishlist as Wishlist).id;
    setActiveWishlistId(newId);
    localStorage.setItem(ACTIVE_WISHLIST_KEY, newId);
    if (onWishlistChangeRef.current) {
      onWishlistChangeRef.current(newId);
    }

    setCreating(false);
  };

  if (loading) {
    return (
      <select className="select" disabled style={{ minWidth: 200 }}>
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <>
      <select
        className="select"
        value={activeWishlistId || ""}
        onChange={(e) => handleWishlistChange(e.target.value)}
        style={{ minWidth: 200 }}
      >
        {wishlists.map((wishlist) => (
          <option key={wishlist.id} value={wishlist.id}>
            {wishlist.name}
          </option>
        ))}
        <option value="new">+ New cart</option>
      </select>

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400, width: "90%" }}
          >
            <div className="panel-body">
              <h2 style={{ marginBottom: 16 }}>Create New Cart</h2>
              <form onSubmit={handleCreateCart}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label" htmlFor="cart-name">
                    Cart Name
                  </label>
                  <input
                    id="cart-name"
                    type="text"
                    className="input"
                    value={newCartName}
                    onChange={(e) => setNewCartName(e.target.value)}
                    placeholder="e.g., Summer Clothes"
                    required
                    autoFocus
                    disabled={creating}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCartName("");
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button"
                    disabled={creating || !newCartName.trim()}
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function getActiveWishlistId(): string | null {
  return localStorage.getItem(ACTIVE_WISHLIST_KEY);
}

export function setActiveWishlistId(id: string): void {
  localStorage.setItem(ACTIVE_WISHLIST_KEY, id);
}

