import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import ItemForm from "../components/ItemForm";
import WishlistSelector, { getActiveWishlistId } from "../components/WishlistSelector";

type NewItem = {
  url: string;
  store: string;
  name: string;
  price: string;
  notes: string;
  tags: string;
  status: "considering" | "bought" | "dropped";
  decision_reason: string;
};

export default function AddItem() {
  const { user } = useAuth();
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(null);
  const [form, setForm] = useState<NewItem>({
    url: "",
    store: "",
    name: "",
    price: "",
    notes: "",
    tags: "",
    status: "considering",
    decision_reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedId = getActiveWishlistId();
    if (storedId) {
      setActiveWishlistId(storedId);
    }
  }, []);

  const handleWishlistChange = (wishlistId: string) => {
    setActiveWishlistId(wishlistId);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

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

    const { error } = await supabase.from("items").insert([
      {
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
        user_id: user.id,
        wishlist_id: activeWishlistId,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      setError(error.message);
    } else {
      setForm({
        url: "",
        store: "",
        name: "",
        price: "",
        notes: "",
        tags: "",
        status: "considering",
        decision_reason: "",
      });
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
    });
    setError(null);
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
