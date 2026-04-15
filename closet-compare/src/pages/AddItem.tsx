import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useItems } from "../hooks/useItems";
import { useActiveWishlist } from "../contexts/ActiveWishlistContext";
import { useWishlists } from "../hooks/useWishlists";
import ItemForm from "../components/ItemForm";
import WishlistSelector from "../components/WishlistSelector";

type NewItem = {
  url: string;
  store: string;
  name: string;
  price: string;
  notes: string;
  tags: string;
  status: "considering" | "bought" | "dropped";
  decision_reason: string;
  image_url: string;
};

export default function AddItem() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { activeWishlistId, setActiveWishlistId } = useActiveWishlist();
  const { wishlists } = useWishlists(user?.id || null);
  const [form, setForm] = useState<NewItem>({
    url: "",
    store: "",
    name: "",
    price: "",
    notes: "",
    tags: "",
    status: "considering",
    decision_reason: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWishlistId, setSavedWishlistId] = useState<string | null>(null);
  const hasPrefilledRef = useRef(false);

  // Prefill form from URL query params (only once on mount)
  useEffect(() => {
    if (hasPrefilledRef.current) return;

    const urlParam = searchParams.get("url");
    const nameParam = searchParams.get("name");
    const priceParam = searchParams.get("price");
    const storeParam = searchParams.get("store");
    const tagsParam = searchParams.get("tags");
    const imageUrlParam = searchParams.get("image_url");

    console.log("Reading URL params:", { urlParam, nameParam, priceParam, storeParam, tagsParam, imageUrlParam });

    // Only prefill if at least one param exists
    if (urlParam || nameParam || priceParam || storeParam || tagsParam || imageUrlParam) {
      console.log("Prefilling form with:", { urlParam, nameParam, priceParam, storeParam, tagsParam, imageUrlParam });
      setForm((prev) => ({
        ...prev,
        url: urlParam ?? prev.url,
        name: nameParam ?? prev.name,
        price: priceParam ?? prev.price,
        store: storeParam ?? prev.store,
        tags: tagsParam ?? prev.tags,
        image_url: imageUrlParam ?? prev.image_url,
      }));
      hasPrefilledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleWishlistChange = (wishlistId: string) => {
    setActiveWishlistId(wishlistId);
  };

  const { createItem } = useItems(activeWishlistId);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSavedWishlistId(null);

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const priceNumber =
      form.price.trim() === "" ? null : Number(form.price);

    const nameValue = form.name.trim() || null;

    if (!user) {
      setError("You must be signed in to add items");
      setLoading(false);
      return;
    }

    if (!activeWishlistId) {
      setError("Please select a cart first");
      setLoading(false);
      return;
    }

    // Guard: Validate that activeWishlistId belongs to current user
    const isValidWishlist = wishlists.some((w) => w.id === activeWishlistId);
    if (!isValidWishlist) {
      setError("Selected cart is invalid. Please select a valid cart.");
      // Reset to first wishlist if available
      if (wishlists.length > 0) {
        setActiveWishlistId(wishlists[0].id);
      } else {
        setActiveWishlistId(null);
      }
      setLoading(false);
      return;
    }

    try {
      await createItem({
        url: form.url,
        store: form.store,
        name: nameValue,
        price: priceNumber,
        notes: form.notes.trim() || null,
        tags: tagsArray,
        status: form.status,
        decision_reason:
          form.status !== "considering" && form.decision_reason.trim()
            ? form.decision_reason.trim()
            : null,
        image_url: form.image_url.trim() || null,
        user_id: user.id,
        wishlist_id: activeWishlistId,
      });

      setSavedWishlistId(activeWishlistId);
      setForm({
        url: "",
        store: "",
        name: "",
        price: "",
        notes: "",
        tags: "",
        status: "considering",
        decision_reason: "",
        image_url: "",
      });
    } catch (error: any) {
      console.error("Error creating item:", error);
      setError(error.message || "Failed to create item");
    }

    setLoading(false);
  };

  const handleClear = () => {
    setForm({
      url: "",
      store: "",
      name: "",
      price: "",
      notes: "",
      tags: "",
      status: "considering",
      decision_reason: "",
      image_url: "",
    });
    setError(null);
    setSavedWishlistId(null);
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
            <h1>Add Item</h1>
            <p className="subtitle">Add a new item to your cart</p>
          </div>
          <div>
            <label className="label" style={{ marginBottom: 8, display: "block" }}>
              Select Cart
            </label>
            <WishlistSelector onWishlistChange={handleWishlistChange} />
          </div>
        </div>

        {error && <div className="toast">{error}</div>}

        {savedWishlistId && (
          <div
            style={{
              padding: "12px 16px",
              background: "#d1fae5",
              color: "#065f46",
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Item saved!</span>
            <Link
              to="/"
              style={{ color: "#065f46", fontWeight: 600, textDecoration: "underline" }}
              onClick={() => setSavedWishlistId(null)}
            >
              View wishlist →
            </Link>
          </div>
        )}

        {activeWishlistId ? (
          <ItemForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            onClear={handleClear}
            loading={loading}
          />
        ) : (
          <div className="empty">
            <p>Please select a cart to add items</p>
          </div>
        )}
      </div>
    </div>
  );
}
