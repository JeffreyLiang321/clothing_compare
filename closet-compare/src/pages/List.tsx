import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Item, Wishlist, WishlistShare } from "../types";
import ItemTable from "../components/ItemTable";
import InsightBar from "../components/InsightBar";
import WishlistSelector from "../components/WishlistSelector";

type FilterStatus = "all" | "considering" | "bought" | "dropped";

export default function List() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [accountShareEmail, setAccountShareEmail] = useState("");
  const [accountShareLoading, setAccountShareLoading] = useState(false);
  const [accountShareMessage, setAccountShareMessage] = useState<string | null>(null);
  const [accountShares, setAccountShares] = useState<WishlistShare[]>([]);

  useEffect(() => {
    const loadWishlistData = async () => {
      if (!user || !activeWishlistId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("id", activeWishlistId)
        .eq("user_id", user.id)
        .single();

      if (wishlistError) {
        console.error("Error fetching wishlist:", wishlistError);
        setLoading(false);
        return;
      }

      setWishlist(wishlistData as Wishlist);

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("wishlist_id", activeWishlistId)
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
      } else {
        setItems(itemsData || []);
      }

      const { data: sharesData, error: sharesError } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("wishlist_id", activeWishlistId)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (sharesError) {
        console.error("Error fetching shares:", sharesError);
      } else {
        setAccountShares(sharesData || []);
      }

      setLoading(false);
    };

    loadWishlistData();
  }, [user, activeWishlistId]);

  const handleWishlistChange = (wishlistId: string) => {
    setActiveWishlistId(wishlistId);
  };

  const handleAccountShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWishlistId || !user || !user.email) return;

    const email = accountShareEmail.trim().toLowerCase();
    if (!email) {
      setAccountShareMessage("Please enter an email address");
      return;
    }

    if (email === user.email.toLowerCase()) {
      setAccountShareMessage("You cannot share with yourself");
      return;
    }

    setAccountShareLoading(true);
    setAccountShareMessage(null);

    const { error } = await supabase.from("wishlist_shares").insert([
      {
        wishlist_id: activeWishlistId,
        owner_id: user.id,
        owner_email: user.email,
        shared_with_email: email,
      },
    ]);

    if (error) {
      console.error("Error sharing wishlist:", error);
      setAccountShareMessage(error.message || "Failed to share wishlist");
    } else {
      setAccountShareEmail("");
      setAccountShareMessage("Wishlist shared successfully!");
      const { data: sharesData } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("wishlist_id", activeWishlistId)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (sharesData) {
        setAccountShares(sharesData);
      }
      setTimeout(() => setAccountShareMessage(null), 3000);
    }

    setAccountShareLoading(false);
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!activeWishlistId || !user) return;

    const { error } = await supabase
      .from("wishlist_shares")
      .delete()
      .eq("id", shareId)
      .eq("wishlist_id", activeWishlistId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error removing share:", error);
      alert("Failed to remove share");
    } else {
      setAccountShares(accountShares.filter((share) => share.id !== shareId));
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

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    } else {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleUpdate = async (updatedItem: Item) => {
    const tagsArray = Array.isArray(updatedItem.tags)
      ? updatedItem.tags
      : [];

    const priceNumber = updatedItem.price;

    const updateData = {
      store: updatedItem.store,
      name: updatedItem.name || null,
      price: priceNumber,
      notes: updatedItem.notes || null,
      tags: tagsArray,
      status: updatedItem.status,
      decision_reason:
        updatedItem.status !== "considering" && updatedItem.decision_reason
          ? updatedItem.decision_reason
          : null,
    };

    const { error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", updatedItem.id);

    if (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    } else {
      setItems(
        items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
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
                type="email"
                className="input"
                value={accountShareEmail}
                onChange={(e) => setAccountShareEmail(e.target.value)}
                placeholder="recipient@email.com"
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
                    <span style={{ fontSize: 14 }}>{share.shared_with_email}</span>
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
          />
        )}
      </div>
    </div>
  );
}
