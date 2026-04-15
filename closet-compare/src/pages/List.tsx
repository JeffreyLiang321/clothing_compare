import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useItems } from "../hooks/useItems";
import { useWishlists } from "../hooks/useWishlists";
import { useWishlistShares } from "../hooks/useWishlistShares";
import { useProfile } from "../hooks/useProfile";
import { useActiveWishlist } from "../contexts/ActiveWishlistContext";
import { useItemReactions } from "../hooks/useItemReactions";
import type { Item } from "../types";
import ItemTable from "../components/ItemTable";
import InsightBar from "../components/InsightBar";
import WishlistSelector from "../components/WishlistSelector";

type FilterStatus = "all" | "considering" | "bought" | "dropped";

export default function List() {
  const { user } = useAuth();
  const { activeWishlistId, setActiveWishlistId } = useActiveWishlist();
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [accountShareUsername, setAccountShareUsername] = useState("");
  const [accountShareLoading, setAccountShareLoading] = useState(false);
  const [accountShareMessage, setAccountShareMessage] = useState<string | null>(null);

  const { items, loading: itemsLoading, updateItem, deleteItem } = useItems(activeWishlistId);
  const { wishlists } = useWishlists(user?.id || null);
  const { shares: accountShares, loading: sharesLoading, createShare, deleteShare } = useWishlistShares(
    activeWishlistId,
    user?.id || null
  );
  const { findUserIdByUsername } = useProfile(null);

  // Get item IDs for reactions hook - only fetch reactions if wishlist is shared
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const isShared = accountShares.length > 0;
  const { reactions, scores, toggleReaction } = useItemReactions(
    isShared ? activeWishlistId : null,
    user?.id || null,
    itemIds
  );

  const loading = itemsLoading || sharesLoading;

  // Get the current wishlist name from the wishlists array (automatically updates on rename)
  const wishlist = activeWishlistId
    ? wishlists.find((w) => w.id === activeWishlistId) || null
    : null;

  const handleWishlistChange = (wishlistId: string) => {
    setActiveWishlistId(wishlistId);
  };

  const handleAccountShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWishlistId || !user) return;

    const username = accountShareUsername.trim().toLowerCase();
    if (!username) {
      setAccountShareMessage("Please enter a username");
      return;
    }

    setAccountShareLoading(true);
    setAccountShareMessage(null);

    try {
      // Find user by username
      const recipientUserId = await findUserIdByUsername(username);

      // Check if sharing with self
      if (recipientUserId === user.id) {
        setAccountShareMessage("You cannot share with yourself");
        setAccountShareLoading(false);
        return;
      }

      // Check if already shared
      const alreadyShared = accountShares.some(
        (share) => share.recipient_user_id === recipientUserId
      );
      if (alreadyShared) {
        setAccountShareMessage("Wishlist is already shared with this user");
        setAccountShareLoading(false);
        return;
      }

      await createShare({
        wishlist_id: activeWishlistId,
        owner_user_id: user.id,
        recipient_user_id: recipientUserId,
      });

      setAccountShareUsername("");
      setAccountShareMessage("Wishlist shared successfully!");
      setTimeout(() => setAccountShareMessage(null), 3000);
    } catch (error: any) {
      console.error("Error sharing wishlist:", error);
      // Show user-friendly error message
      const errorMessage = error.message || "Failed to share wishlist";
      setAccountShareMessage(errorMessage);
    }

    setAccountShareLoading(false);
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!activeWishlistId || !user) return;

    try {
      await deleteShare(shareId);
    } catch (error) {
      console.error("Error removing share:", error);
      alert("Failed to remove share");
    }
  };

  const filteredItems =
    filter === "all"
      ? items
      : items.filter((item) => item.status === filter);

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === "price-asc") {
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    }
    if (sort === "price-desc") {
      return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    }
    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await deleteItem(id);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const handleUpdate = async (updatedItem: Item) => {
    try {
      await updateItem(updatedItem);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    }
  };

  return (
    <div className="panel">
      <div className="panel-body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1>Your Wishlist</h1>
            <p className="subtitle">Track and compare items you want to buy</p>
          </div>
          <div>
            <label className="label" style={{ marginBottom: 8, display: "block" }}>
              Select Cart
            </label>
            <WishlistSelector onWishlistChange={handleWishlistChange} />
          </div>
        </div>

        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f9fafb",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Share to account
          </h3>
          <form onSubmit={handleAccountShare} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input
                type="text"
                className="input"
                value={accountShareUsername}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  // Only allow lowercase letters, numbers, and underscores
                  if (value === "" || /^[a-z0-9_]*$/.test(value)) {
                    setAccountShareUsername(value);
                  }
                }}
                placeholder="username"
                required
                disabled={accountShareLoading}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="button"
                disabled={accountShareLoading}
                style={{ fontSize: 14, padding: "12px 16px" }}
              >
                {accountShareLoading ? "Sharing..." : "Share"}
              </button>
            </div>
            {accountShareMessage && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color:
                    accountShareMessage.includes("successfully") ||
                    accountShareMessage.includes("shared")
                      ? "#065f46"
                      : "#991b1b",
                }}
              >
                {accountShareMessage}
              </div>
            )}
          </form>
          {accountShares.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: "var(--muted)",
                }}
              >
                Shared with:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accountShares.map((share) => (
                  <div
                    key={share.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      @{share.recipient_username || "unknown"}
                    </span>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleRemoveShare(share.id)}
                      style={{ fontSize: 12, padding: "4px 8px" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <InsightBar items={items} />

        <div style={{ marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <label className="label" style={{ marginBottom: 8, display: "block" }}>
              Filter
            </label>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "considering" ? "active" : ""}`}
                onClick={() => setFilter("considering")}
              >
                Considering
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "bought" ? "active" : ""}`}
                onClick={() => setFilter("bought")}
              >
                Bought
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "dropped" ? "active" : ""}`}
                onClick={() => setFilter("dropped")}
              >
                Dropped
              </button>
            </div>
          </div>
          <div>
            <label className="label" style={{ marginBottom: 8, display: "block" }} htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              style={{ maxWidth: 200, fontSize: 14, padding: "8px 36px 8px 16px", borderRadius: 20, fontWeight: 500 }}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : sortedItems.length === 0 ? (
          <div className="empty">
            <p>No items in "{wishlist?.name || "this cart"}" yet</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Start adding items to your cart!
            </p>
          </div>
        ) : (
          <ItemTable
            items={sortedItems}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            showReactions={isShared}
            userReactions={reactions}
            itemScores={scores}
            onToggleReaction={toggleReaction}
            canVote={false}
          />
        )}
      </div>
    </div>
  );
}
