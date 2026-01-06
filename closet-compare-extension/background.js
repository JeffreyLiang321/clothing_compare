const APP_ORIGIN = "http://localhost:5173";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const url = window.location.href;

      const ogTitle =
        document.querySelector('meta[property="og:title"]')?.content ||
        document.querySelector('meta[name="twitter:title"]')?.content ||
        "";
      const name = (ogTitle || document.title || "").trim();

      // Store from hostname
      const host = window.location.hostname.replace(/^www\./, "");
      const store = host.split(".")[0] || host;

      // Best-effort price
      const metaPrice =
        document.querySelector('meta[property="product:price:amount"]')?.content ||
        document.querySelector('meta[property="og:price:amount"]')?.content ||
        "";

      let price = "";
      if (metaPrice) {
        price = String(metaPrice).trim();
      } else {
        const text = document.body?.innerText || "";
        const m = text.match(/(\$|US\$|HK\$|£|€)\s?\d{1,5}(?:[.,]\d{2})?/);
        if (m?.[0]) price = m[0];
      }

      return { url, name, store, price };
    }
  });

  const data = result || {};
  const params = new URLSearchParams();

  if (data.url) params.set("url", data.url);
  if (data.name) params.set("name", data.name);

  if (data.store) {
    const s = data.store;
    params.set("store", s.charAt(0).toUpperCase() + s.slice(1));
  }

  if (data.price) {
    const numeric = String(data.price).replace(/[^0-9.]/g, "");
    if (numeric) params.set("price", numeric);
  }

  const addUrl = `${APP_ORIGIN}/add?${params.toString()}`;
  chrome.tabs.create({ url: addUrl });
});
