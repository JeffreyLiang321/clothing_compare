type Props = {
  form: {
    url: string;
    store: string;
    price: string;
    name: string;
    notes: string;
    tags: string;
    status: "considering" | "bought" | "dropped";
    decision_reason: string;
    image_url: string;
  };
  onChange: (f: any) => void;
  onSubmit: () => void;
  onClear?: () => void;
  loading: boolean;
};

export default function ItemForm({
  form,
  onChange,
  onSubmit,
  onClear,
  loading,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="form-grid">
        <div>
          <label className="label" htmlFor="url">
            URL
          </label>
          <input
            id="url"
            type="url"
            className="input"
            value={form.url}
            onChange={(e) => onChange({ ...form, url: e.target.value })}
            required
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="label" htmlFor="store">
            Store
          </label>
          <input
            id="store"
            type="text"
            className="input"
            value={form.store}
            onChange={(e) => onChange({ ...form, store: e.target.value })}
            required
            placeholder="Store name"
          />
        </div>

        <div>
          <label className="label" htmlFor="price">
            Price
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            className="input"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g., T-shirt"
          />
        </div>

        <div>
          <label className="label" htmlFor="tags">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            className="input"
            value={form.tags}
            onChange={(e) => onChange({ ...form, tags: e.target.value })}
            placeholder="e.g., shirt, casual, blue"
          />
        </div>

        <div className="form-grid-full">
          <label className="label" htmlFor="image_url">
            Image URL (optional)
          </label>
          <input
            id="image_url"
            type="url"
            className="input"
            value={form.image_url}
            onChange={(e) => onChange({ ...form, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          {form.image_url && (
            <div style={{ marginTop: 8 }}>
              <img
                src={form.image_url}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="select"
            value={form.status}
            onChange={(e) =>
              onChange({
                ...form,
                status: e.target.value as "considering" | "bought" | "dropped",
                decision_reason: "",
              })
            }
          >
            <option value="considering">Considering</option>
            <option value="bought">Bought</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        <div className="form-grid-full">
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="textarea"
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
          />
        </div>

        {(form.status === "bought" || form.status === "dropped") && (
          <div className="form-grid-full">
            <label className="label" htmlFor="decision_reason">
              Decision reason
            </label>
            <textarea
              id="decision_reason"
              className="textarea"
              value={form.decision_reason}
              onChange={(e) =>
                onChange({ ...form, decision_reason: e.target.value })
              }
              placeholder={
                form.status === "bought"
                  ? "Why did you buy this?"
                  : "Why did you drop this?"
              }
            />
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="button" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        {onClear && (
          <button
            type="button"
            className="button secondary"
            onClick={onClear}
            disabled={loading}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
