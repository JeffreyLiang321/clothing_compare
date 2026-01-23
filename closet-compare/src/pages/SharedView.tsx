import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useItems } from "../hooks/useItems";
import { useWishlists } from "../hooks/useWishlists";
import { useWishlistShares } from "../hooks/useWishlistShares";
import { useActiveWishlist } from "../contexts/ActiveWishlistContext";
import { useItemReactions } from "../hooks/useItemReactions";
import type { Wishlist } from "../types";
import ItemTable from "../components/ItemTable";
import InsightBar from "../components/InsightBar";

type FilterStatus = "all" | "considering" | "bought" | "dropped";

export default function SharedView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { activeWishlistId } = useActiveWishlist();
  const { items, loading: itemsLoading } = useItems(id || null);
  const { getShareByWishlistAndUserId } = useWishlistShares(null, null);
  const { getWishlistById } = useWishlists(null);
  const { createItem } = useItems(activeWishlistId);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [savingCopy, setSavingCopy] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  // Get item IDs for reactions hook
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { reactions, scores, toggleReaction } = useItemReactions(
    id || null,
    user?.id || null,
    itemIds
  );

  useEffect(() => {
    const fetchWishlist = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Don't enter loading state if prerequisites are missing
      if (!id) {
        setError("Invalid wishlist ID");
        setWishlistLoading(false);
        setWishlist(null);
        isFetchingRef.current = false;
        lastFetchedIdRef.current = null;
        return;
      }

      if (!user?.id) {
        setError("You must be signed in to view shared wishlists");
        setWishlistLoading(false);
        setWishlist(null);
        isFetchingRef.current = false;
        lastFetchedIdRef.current = null;
        return;
      }

      // Prevent duplicate fetches - if already fetching or already fetched this ID, skip
      if (isFetchingRef.current || lastFetchedIdRef.current === id) {
        return;
      }

      // If ID changed, reset the last fetched ID to allow new fetch
      if (lastFetchedIdRef.current && lastFetchedIdRef.current !== id) {
        lastFetchedIdRef.current = null;
      }

      isFetchingRef.current = true;
      lastFetchedIdRef.current = id;
      setWishlistLoading(true);
      setError(null);

      try {
        console.log("[SharedView] Fetching share access for wishlist:", id, "user ID:", user.id);
        await getShareByWishlistAndUserId(id, user.id);

        console.log("[SharedView] Share access confirmed, fetching wishlist data...");
        const wishlistData = await getWishlistById(id);
        console.log("[SharedView] Successfully loaded wishlist:", wishlistData.name);
        setWishlist(wishlistData);
      } catch (error: any) {
        console.error(
          "[SharedView] Error fetching shared wishlist:",
          {
            error,
            wishlist_id: id,
            userId: user.id,
            table: "wishlist_shares or wishlists",
          }
        );
        // Check if it's an access error or wishlist not found error
        if (error?.message?.includes("No rows") || error?.code === "PGRST116") {
          setError("Wishlist not found");
        } else {
          setError("You don't have access to this wishlist");
        }
        setWishlist(null);
      } finally {
        // ALWAYS set loading to false, regardless of success or error
        setWishlistLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchWishlist();
    // Only depend on id and user.id, not the entire user object or getShareByWishlistAndUserId function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id, authLoading]);

  const loading = itemsLoading || wishlistLoading;

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

  const handleSaveCopy = async () => {
    if (!user || !items.length) return;

    if (!activeWishlistId) {
      setCopyMessage("Please select a cart first");
      setTimeout(() => setCopyMessage(null), 3000);
      return;
    }

    setSavingCopy(true);
    setCopyMessage(null);

    try {
      // Copy items one by one using the hook
      await Promise.all(
        items.map((item) =>
          createItem({
            url: item.url,
            store: item.store,
            name: item.name,
            price: item.price,
            notes: item.notes,
            tags: item.tags,
            status: item.status,
            decision_reason: item.decision_reason,
            image_url: item.image_url,
            user_id: user.id,
            wishlist_id: activeWishlistId,
          })
        )
      );

      setCopyMessage(`Copied ${items.length} item(s) to your cart!`);
    } catch (error) {
      console.error("Error copying items:", error);
      setCopyMessage("Failed to copy items");
    }

    setSavingCopy(false);
    setTimeout(() => setCopyMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">
            <p>{error || "Wishlist not found"}</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1>{wishlist.name}</h1>
            <p className="subtitle">Shared wishlist (read-only)</p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              className="button"
              onClick={handleSaveCopy}
              disabled={savingCopy}
              style={{ fontSize: 14, padding: "8px 16px" }}
            >
              {savingCopy ? "Copying..." : "Save a copy"}
            </button>
          )}
        </div>

        {copyMessage && (
          <div
            className="toast"
            style={{
              marginBottom: 16,
              background:
                copyMessage.includes("Copied") || copyMessage.includes("success")
                  ? "#d1fae5"
                  : "#fee2e2",
              color:
                copyMessage.includes("Copied") || copyMessage.includes("success")
                  ? "#065f46"
                  : "#991b1b",
            }}
          >
            {copyMessage}
          </div>
        )}

        <InsightBar items={items} />

        <div style={{ marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
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
            <label className="label" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              style={{ maxWidth: 200 }}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="empty">
            <p>No items in this wishlist</p>
          </div>
        ) : (
          <ItemTable
            items={sortedItems}
            readOnly
            showReactions={true}
            userReactions={reactions}
            itemScores={scores}
            onToggleReaction={toggleReaction}
          />
        )}
      </div>
    </div>
  );
}

