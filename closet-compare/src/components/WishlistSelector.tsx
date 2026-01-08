import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWishlists } from "../hooks/useWishlists";

const ACTIVE_WISHLIST_KEY = "activeWishlistId";

type Props = {
  onWishlistChange?: (wishlistId: string) => void;
};

export default function WishlistSelector({ onWishlistChange }: Props) {
  const { user } = useAuth();
  const { wishlists, loading: wishlistsLoading, createWishlist, refetch } = useWishlists(user?.id || null);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [creating, setCreating] = useState(false);
  const onWishlistChangeRef = useRef(onWishlistChange);
  const hasInitializedRef = useRef(false);

  // Keep the callback ref updated without causing re-renders
  useEffect(() => {
    onWishlistChangeRef.current = onWishlistChange;
  }, [onWishlistChange]);

  useEffect(() => {
    const initializeWishlists = async () => {
      if (!user || wishlistsLoading || hasInitializedRef.current) {
        return;
      }

      hasInitializedRef.current = true;

      let wishlistsList = wishlists;

      // Create default wishlist if none exist
      if (wishlistsList.length === 0) {
        try {
          const newWishlist = await createWishlist("My Wishlist");
          wishlistsList = [newWishlist];
          await refetch();
        } catch (error) {
          console.error("Error creating default wishlist:", error);
          hasInitializedRef.current = false;
          return;
        }
      }

      // Set active wishlist from localStorage or first wishlist
      const storedId = localStorage.getItem(ACTIVE_WISHLIST_KEY);
      let activeId: string;

      if (!storedId || !wishlistsList.find((w) => w.id === storedId)) {
        activeId = wishlistsList[0].id;
        localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
      } else {
        activeId = storedId;
      }

      setActiveWishlistId(activeId);
      if (onWishlistChangeRef.current) {
        onWishlistChangeRef.current(activeId);
      }
    };

    initializeWishlists();
  }, [user, wishlists, wishlistsLoading, createWishlist, refetch]);

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

    try {
      const newWishlist = await createWishlist(newCartName.trim());
      await refetch();

      setNewCartName("");
      setShowCreateModal(false);

      const newId = newWishlist.id;
      setActiveWishlistId(newId);
      localStorage.setItem(ACTIVE_WISHLIST_KEY, newId);
      if (onWishlistChangeRef.current) {
        onWishlistChangeRef.current(newId);
      }
    } catch (error) {
      console.error("Error creating wishlist:", error);
      alert("Failed to create cart");
    }

    setCreating(false);
  };

  if (wishlistsLoading) {
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

