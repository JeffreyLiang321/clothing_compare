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
  const hasRefetchedRef = useRef(false);

  // Keep the callback ref updated without causing re-renders
  useEffect(() => {
    onWishlistChangeRef.current = onWishlistChange;
  }, [onWishlistChange]);

  // Reset initialization state when user changes
  useEffect(() => {
    hasInitializedRef.current = false;
    hasRefetchedRef.current = false;
    setActiveWishlistId(null);
  }, [user?.id]);

  useEffect(() => {
    const initializeWishlists = async () => {
      console.log("[WishlistSelector] initializeWishlists called", {
        user: user?.id,
        wishlistsLoading,
        hasInitialized: hasInitializedRef.current,
        wishlistsCount: wishlists.length,
        hasRefetched: hasRefetchedRef.current,
        wishlistIds: wishlists.map((w) => w.id),
      });

      // Only run when loading completes and we haven't initialized yet
      if (!user || wishlistsLoading || hasInitializedRef.current) {
        console.log("[WishlistSelector] Early return:", {
          noUser: !user,
          loading: wishlistsLoading,
          initialized: hasInitializedRef.current,
        });
        return;
      }

      // If wishlists is empty and we haven't done a defensive refetch yet, do it
      // This ensures we have the latest data before creating a default
      if (wishlists.length === 0 && !hasRefetchedRef.current) {
        console.log("[WishlistSelector] Doing defensive refetch (wishlists is empty)");
        hasRefetchedRef.current = true;
        await refetch();
        console.log("[WishlistSelector] Defensive refetch completed, effect will re-run");
        // If refetch populated wishlists, let the effect re-run with the new data
        return;
      }

      // Now we're confident the list is loaded (either populated or confirmed empty)
      // Mark as initialized to prevent duplicate creation
      hasInitializedRef.current = true;
      console.log("[WishlistSelector] Marked as initialized. Current wishlists count:", wishlists.length);

      // If still empty after refetch, create default wishlist
      if (wishlists.length === 0) {
        console.log("[WishlistSelector] Creating default 'My Wishlist' (confirmed empty after refetch)");
        try {
          const newWishlist = await createWishlist("My Wishlist");
          console.log("[WishlistSelector] Created default wishlist:", newWishlist.id);
          await refetch();

          const activeId = newWishlist.id;
          setActiveWishlistId(activeId);
          localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
          if (onWishlistChangeRef.current) {
            onWishlistChangeRef.current(activeId);
          }
        } catch (error) {
          console.error("Error creating default wishlist:", error);
          hasInitializedRef.current = false;
        }
        return;
      }

      // If wishlists exist, set active from localStorage or first wishlist
      console.log("[WishlistSelector] Wishlists exist, setting active wishlist. Available:", wishlists.map((w) => ({ id: w.id, name: w.name })));
      const storedId = localStorage.getItem(ACTIVE_WISHLIST_KEY);
      const activeId =
        storedId && wishlists.some((w) => w.id === storedId)
          ? storedId
          : wishlists[0].id;

      console.log("[WishlistSelector] Setting active wishlist:", activeId);
      setActiveWishlistId(activeId);
      localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
      if (onWishlistChangeRef.current) {
        onWishlistChangeRef.current(activeId);
      }
    };

    initializeWishlists();
  }, [user?.id, wishlistsLoading, wishlists.length, refetch, createWishlist]);

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

