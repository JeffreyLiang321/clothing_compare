const originInput = document.getElementById("origin");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

function normalizeOrigin(v) {
  let s = String(v || "").trim();
  if (!s) return "";
  // remove trailing slash
  s = s.replace(/\/$/, "");
  return s;
}

async function load() {
  const { appOrigin } = await chrome.storage.sync.get(["appOrigin"]);
  originInput.value = appOrigin || "http://localhost:5173";
}

async function save() {
  const origin = normalizeOrigin(originInput.value);
  if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
    statusEl.textContent = "Please enter a valid URL starting with http:// or https://";
    statusEl.style.color = "crimson";
    return;
  }
  await chrome.storage.sync.set({ appOrigin: origin });
  statusEl.textContent = `Saved: ${origin}`;
  statusEl.style.color = "green";
}

saveBtn.addEventListener("click", save);
load();
