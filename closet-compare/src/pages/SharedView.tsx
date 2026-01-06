import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Item, Wishlist } from "../types";
import ItemTable from "../components/ItemTable";
import InsightBar from "../components/InsightBar";
import { getActiveWishlistId } from "../components/WishlistSelector";

type FilterStatus = "all" | "considering" | "bought" | "dropped";

export default function SharedView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [savingCopy, setSavingCopy] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!id) {
        setError("Invalid wishlist ID");
        setLoading(false);
        return;
      }

      if (!user?.email) {
        setError("You must be signed in to view shared wishlists");
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: shareData, error: shareError } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("wishlist_id", id)
        .ilike("shared_with_email", user.email)
        .single();

      if (shareError || !shareData) {
        setError("You don't have access to this wishlist");
        setLoading(false);
        return;
      }

      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("id", id)
        .single();

      if (wishlistError || !wishlistData) {
        setError("Wishlist not found");
        setLoading(false);
        return;
      }

      setWishlist(wishlistData as Wishlist);

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("wishlist_id", id)
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        setError("Failed to load items");
      } else {
        setItems(itemsData || []);
      }

      setLoading(false);
    };

    fetchWishlist();
  }, [id, user, authLoading]);

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

    const activeWishlistId = getActiveWishlistId();
    if (!activeWishlistId) {
      setCopyMessage("Please select a cart first");
      setTimeout(() => setCopyMessage(null), 3000);
      return;
    }

    setSavingCopy(true);
    setCopyMessage(null);

    const itemsToInsert = items.map((item) => ({
      url: item.url,
      store: item.store,
      name: item.name,
      price: item.price,
      notes: item.notes,
      tags: item.tags,
      status: item.status,
      decision_reason: item.decision_reason,
      user_id: user.id,
      wishlist_id: activeWishlistId,
    }));

    const { error } = await supabase.from("items").insert(itemsToInsert);

    if (error) {
      console.error("Error copying items:", error);
      setCopyMessage("Failed to copy items");
    } else {
      setCopyMessage(`Copied ${items.length} item(s) to your cart!`);
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
          <ItemTable items={sortedItems} readOnly />
        )}
      </div>
    </div>
  );
}

