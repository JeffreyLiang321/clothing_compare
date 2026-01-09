import { useState } from "react";
import type { Item } from "../types";

type Props = {
  items: Item[];
  onDelete?: (id: string) => void;
  onUpdate?: (item: Item) => void;
  readOnly?: boolean;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "considering":
      return "Considering";
    case "bought":
      return "Bought";
    case "dropped":
      return "Dropped";
    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "considering":
      return "badge badge-considering";
    case "bought":
      return "badge badge-bought";
    case "dropped":
      return "badge badge-dropped";
    default:
      return "badge";
  }
};

type EditableItem = {
  store: string;
  name: string;
  price: string;
  tags: string;
  notes: string;
  status: "considering" | "bought" | "dropped";
  decision_reason: string;
  image_url: string;
};

function ItemRow({
  item,
  onDelete,
  onUpdate,
  readOnly,
}: {
  item: Item;
  onDelete?: (id: string) => void;
  onUpdate?: (item: Item) => void;
  readOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableItem>(() => ({
    store: item.store,
    name: item.name || "",
    price: item.price?.toString() || "",
    tags: item.tags?.join(", ") || "",
    notes: item.notes || "",
    status: item.status || "considering",
    decision_reason: item.decision_reason || "",
    image_url: item.image_url || "",
  }));

  const handleSave = () => {
    const updatedItem: Item = {
      ...item,
      store: editData.store,
      name: editData.name,
      price: editData.price.trim() === "" ? null : Number(editData.price),
      tags: editData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: editData.notes || null,
      status: editData.status,
      decision_reason:
        editData.status !== "considering" && editData.decision_reason.trim()
          ? editData.decision_reason.trim()
          : null,
      image_url: editData.image_url.trim() || null,
    };
    if (onUpdate) {
      onUpdate(updatedItem);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      store: item.store,
      name: item.name || "",
      price: item.price?.toString() || "",
      tags: item.tags?.join(", ") || "",
      notes: item.notes || "",
      status: item.status || "considering",
      decision_reason: item.decision_reason || "",
      image_url: item.image_url || "",
    });
    setIsEditing(false);
  };

  if (isEditing && !readOnly && onUpdate) {
    return (
      <tr>
        <td style={{ minWidth: 140, width: "auto" }}>
          <input
            type="text"
            className="input"
            value={editData.store}
            onChange={(e) =>
              setEditData({ ...editData, store: e.target.value })
            }
            style={{ width: "100%", minWidth: 140 }}
          />
        </td>
        <td style={{ minWidth: 110, width: "auto" }}>
          <input
            type="number"
            step="0.01"
            className="input"
            value={editData.price}
            onChange={(e) =>
              setEditData({ ...editData, price: e.target.value })
            }
            placeholder="0.00"
            style={{ width: "100%", minWidth: 110 }}
          />
        </td>
        <td style={{ minWidth: 80, width: "auto" }}>
          <input
            type="url"
            className="input"
            value={editData.image_url}
            onChange={(e) =>
              setEditData({ ...editData, image_url: e.target.value })
            }
            placeholder="Image URL"
            style={{ width: "100%", minWidth: 80, fontSize: 12 }}
          />
          {editData.image_url && (
            <img
              src={editData.image_url}
              alt="Preview"
              style={{
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: 4,
                border: "1px solid var(--border)",
                marginTop: 8,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </td>
        <td style={{ minWidth: 140, width: "auto" }}>
          <input
            type="text"
            className="input"
            value={editData.name}
            onChange={(e) =>
              setEditData({ ...editData, name: e.target.value })
            }
            placeholder="Item name"
            style={{ width: "100%", minWidth: 140 }}
          />
        </td>
        <td style={{ minWidth: 140, width: "auto" }}>
          <select
            className="select"
            value={editData.status}
            onChange={(e) =>
              setEditData({
                ...editData,
                status: e.target.value as "considering" | "bought" | "dropped",
                decision_reason:
                  e.target.value === "considering" ? "" : editData.decision_reason,
              })
            }
            style={{ width: "100%", minWidth: 140 }}
          >
            <option value="considering">Considering</option>
            <option value="bought">Bought</option>
            <option value="dropped">Dropped</option>
          </select>
        </td>
        <td style={{ minWidth: 180, width: "auto" }}>
          <input
            type="text"
            className="input"
            value={editData.tags}
            onChange={(e) =>
              setEditData({ ...editData, tags: e.target.value })
            }
            placeholder="tag1, tag2"
            style={{ width: "100%", minWidth: 180 }}
          />
        </td>
        <td style={{ minWidth: 220, width: "auto" }}>
          <div>
            <textarea
              className="textarea"
              value={editData.notes}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              placeholder="Notes"
              style={{ width: "100%", minWidth: 220, minHeight: 50, marginBottom: 8, fontSize: 14 }}
            />
            {(editData.status === "bought" || editData.status === "dropped") && (
              <textarea
                className="textarea"
                value={editData.decision_reason}
                onChange={(e) =>
                  setEditData({ ...editData, decision_reason: e.target.value })
                }
                placeholder={
                  editData.status === "bought"
                    ? "Why did you buy this?"
                    : "Why did you drop this?"
                }
                style={{ width: "100%", minWidth: 220, minHeight: 50, fontSize: 14 }}
              />
            )}
          </div>
        </td>
        {!readOnly && (
          <td style={{ minWidth: 110, whiteSpace: "nowrap", width: "auto" }}>
            <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "stretch" }}>
              <button
                type="button"
                className="button"
                onClick={handleSave}
                style={{ fontSize: 12, padding: "8px 12px", width: "100%", minWidth: 100 }}
              >
                Save
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleCancel}
                style={{ fontSize: 12, padding: "8px 12px", width: "100%", minWidth: 100 }}
              >
                Cancel
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{item.store}</div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="store-link"
          >
            Open link →
          </a>
        )}
      </td>
      <td>
        {item.price === null || item.price === undefined
          ? "—"
          : `$${item.price.toFixed(2)}`}
      </td>
      <td>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name || "Item"}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid var(--border)",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        )}
      </td>
      <td>
        {item.name || <span style={{ color: "var(--muted)" }}>—</span>}
      </td>
      <td>
        <span className={getStatusClass(item.status || "considering")}>
          {getStatusLabel(item.status || "considering")}
        </span>
      </td>
      <td>
        {item.tags && item.tags.length > 0 ? (
          <div className="badges">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="badge">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        )}
      </td>
      <td>
        <div>
          {item.notes ? (
            <span>{item.notes}</span>
          ) : (
            <span style={{ color: "var(--muted)" }}>—</span>
          )}
          {item.decision_reason && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--muted)",
                fontStyle: "italic",
              }}
            >
              {item.status === "bought" ? "✓ " : "✗ "}
              {item.decision_reason}
            </div>
          )}
        </div>
      </td>
      {!readOnly && (
        <td style={{ minWidth: 100, whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {onUpdate && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsEditing(true)}
                style={{ fontSize: 12, padding: "8px 12px" }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="button secondary"
                onClick={() => onDelete(item.id)}
                style={{ fontSize: 12, padding: "8px 12px", color: "#991b1b" }}
              >
                Delete
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

export default function ItemTable({ items, onDelete, onUpdate, readOnly }: Props) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th style={{ minWidth: 140 }}>Store</th>
            <th style={{ minWidth: 110 }}>Price</th>
            <th style={{ minWidth: 80 }}>Image</th>
            <th style={{ minWidth: 140 }}>Name</th>
            <th style={{ minWidth: 140 }}>Status</th>
            <th style={{ minWidth: 180 }}>Tags</th>
            <th style={{ minWidth: 220 }}>Notes</th>
            {!readOnly && <th style={{ minWidth: 110 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onDelete={onDelete}
              onUpdate={onUpdate}
              readOnly={readOnly}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
