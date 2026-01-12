import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWishlists } from "../hooks/useWishlists";

const ACTIVE_WISHLIST_KEY = "activeWishlistId";

type Props = {
  onWishlistChange?: (wishlistId: string) => void;
};

export default function WishlistSelector({ onWishlistChange }: Props) {
  const { user } = useAuth();
  const { wishlists, loading: wishlistsLoading, error: wishlistsError, createWishlist, renameWishlist, refetch } = useWishlists(user?.id || null);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingWishlistId, setEditingWishlistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const onWishlistChangeRef = useRef(onWishlistChange);
  const hasInitializedRef = useRef(false);

  // Keep the callback ref updated without causing re-renders
  useEffect(() => {
    onWishlistChangeRef.current = onWishlistChange;
  }, [onWishlistChange]);

  // Reset initialization state when user changes
  useEffect(() => {
    hasInitializedRef.current = false;
    setActiveWishlistId(null);
  }, [user?.id]);

  useEffect(() => {
    const initializeWishlists = async () => {
      // Only run when loading completes and we haven't initialized yet
      if (!user || wishlistsLoading || hasInitializedRef.current) {
        return;
      }

      // If there's an error, don't attempt to create default wishlist
      // Mark as initialized to prevent retry loops
      if (wishlistsError) {
        console.error("[WishlistSelector] Error fetching wishlists, skipping initialization:", wishlistsError);
        hasInitializedRef.current = true;
        return;
      }

      // Only create default wishlist if fetch was successful AND wishlists.length === 0
      if (wishlists.length === 0) {
        console.log("[WishlistSelector] Creating default 'My Wishlist' (confirmed empty after successful fetch)");
        // Mark as initialized BEFORE attempting creation to prevent loops
        hasInitializedRef.current = true;
        
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
          // Don't reset hasInitializedRef - we've already tried once
        }
        return;
      }

      // If wishlists exist, set active from localStorage or first wishlist
      hasInitializedRef.current = true;
      const storedId = localStorage.getItem(ACTIVE_WISHLIST_KEY);
      const activeId =
        storedId && wishlists.some((w) => w.id === storedId)
          ? storedId
          : wishlists[0].id;

      setActiveWishlistId(activeId);
      localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
      if (onWishlistChangeRef.current) {
        onWishlistChangeRef.current(activeId);
      }
    };

    initializeWishlists();
  }, [user?.id, wishlistsLoading, wishlists.length, wishlistsError, refetch, createWishlist]);

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

  const handleStartEdit = (wishlistId: string, currentName: string) => {
    setEditingWishlistId(wishlistId);
    setEditingName(currentName);
    setRenameError(null);
    // Focus input after a brief delay to ensure it's rendered
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditingWishlistId(null);
    setEditingName("");
    setRenameError(null);
  };

  const handleSaveEdit = async (wishlistId: string) => {
    if (!user) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setRenameError("Cart name cannot be empty");
      return;
    }

    setRenaming(true);
    setRenameError(null);

    try {
      await renameWishlist(wishlistId, trimmedName);
      setEditingWishlistId(null);
      setEditingName("");
      // Refetch to ensure all components have the latest data
      await refetch();
    } catch (error: any) {
      console.error("Error renaming wishlist:", error);
      setRenameError(error.message || "Failed to rename cart");
    }

    setRenaming(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, wishlistId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(wishlistId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  if (wishlistsLoading) {
    return (
      <select className="select" disabled style={{ minWidth: 200 }}>
        <option>Loading...</option>
      </select>
    );
  }

  if (wishlistsError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
        <div style={{ fontSize: 14, color: "#991b1b", padding: "8px 12px", background: "#fee2e2", borderRadius: 6 }}>
          Failed to load wishlists
        </div>
        <button
          type="button"
          className="button"
          onClick={async () => {
            await refetch();
          }}
          style={{ fontSize: 14, padding: "8px 12px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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

        {activeWishlistId && wishlists.some((w) => w.id === activeWishlistId) && (
          <button
            type="button"
            onClick={() => {
              const wishlist = wishlists.find((w) => w.id === activeWishlistId);
              if (wishlist) {
                handleStartEdit(wishlist.id, wishlist.name);
              }
            }}
            disabled={editingWishlistId !== null}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: editingWishlistId !== null ? "not-allowed" : "pointer",
              color: "var(--text)",
              opacity: editingWishlistId !== null ? 0.5 : 1,
            }}
            title="Rename cart"
          >
            ✏️
          </button>
        )}
      </div>

      {editingWishlistId && (
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
          onClick={handleCancelEdit}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400, width: "90%" }}
          >
            <div className="panel-body">
              <h2 style={{ marginBottom: 16 }}>Rename Cart</h2>
              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="rename-cart-name">
                  Cart Name
                </label>
                <input
                  id="rename-cart-name"
                  ref={editInputRef}
                  type="text"
                  className="input"
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value);
                    setRenameError(null);
                  }}
                  onKeyDown={(e) => handleEditKeyDown(e, editingWishlistId)}
                  placeholder="e.g., Summer Clothes"
                  disabled={renaming}
                  style={{
                    borderColor: renameError ? "#991b1b" : undefined,
                  }}
                />
                {renameError && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      color: "#991b1b",
                    }}
                  >
                    {renameError}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleCancelEdit}
                  disabled={renaming}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => handleSaveEdit(editingWishlistId)}
                  disabled={renaming || !editingName.trim()}
                >
                  {renaming ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

