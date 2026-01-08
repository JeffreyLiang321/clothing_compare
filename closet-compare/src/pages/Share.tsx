import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { useWishlists } from "../hooks/useWishlists";
import type { Item, Wishlist } from "../types";
import ItemTable from "../components/ItemTable";
import InsightBar from "../components/InsightBar";

type FilterStatus = "all" | "considering" | "bought" | "dropped";

export default function Share() {
  const { token } = useParams<{ token: string }>();
  const { getWishlistByToken } = useWishlists(null);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const { items, loading: itemsLoading } = useItems(wishlistId);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!token) {
        setError("Invalid share link");
        setWishlistLoading(false);
        return;
      }

      setWishlistLoading(true);

      try {
        const wishlistData = await getWishlistByToken(token);
        setWishlist(wishlistData);
        setWishlistId(wishlistData.id);
      } catch (error: any) {
        console.error("Error fetching wishlist:", error);
        setError("This wishlist isn't shared or doesn't exist");
      }

      setWishlistLoading(false);
    };

    fetchWishlist();
  }, [token, getWishlistByToken]);

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
            <p>{error || "This wishlist isn't shared"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <h1>{wishlist.name}</h1>
        <p className="subtitle">Shared wishlist</p>

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

