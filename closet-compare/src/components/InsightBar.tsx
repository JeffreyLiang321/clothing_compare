import type { Item } from "../types";

export default function InsightBar({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  const storeCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.store] = (acc[item.store] || 0) + 1;
    return acc;
  }, {});

  const topStore = Object.entries(storeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const prices = items
    .map((item) => item.price)
    .filter((p): p is number => p !== null && p !== undefined)
    .sort((a, b) => a - b);

  const medianPrice =
    prices.length > 0
      ? prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)]
      : null;

  const allTags = items.flatMap((item) => item.tags || []);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const topTag = Object.entries(tagCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const statusCounts = items.reduce(
    (acc, item) => {
      const status = item.status || "considering";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { considering: 0, bought: 0, dropped: 0 } as Record<string, number>
  );

  return (
    <div className="stats-strip">
      <div className="stat">
        <span className="stat-label">Most saved store</span>
        <span className="stat-value">{topStore || "—"}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Median price</span>
        <span className="stat-value">
          {medianPrice !== null ? `$${medianPrice.toFixed(2)}` : "—"}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Top tag</span>
        <span className="stat-value">{topTag || "—"}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Total items</span>
        <span className="stat-value">{items.length}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Considering</span>
        <span className="stat-value">{statusCounts.considering || 0}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Bought</span>
        <span className="stat-value">{statusCounts.bought || 0}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Dropped</span>
        <span className="stat-value">{statusCounts.dropped || 0}</span>
      </div>
    </div>
  );
}
