// ==============================
// Helpers
// ==============================

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

// Default categories (same idea as background.js)
const DEFAULT_CATEGORIES = {
  "leetcode.com": "productive",
  "github.com": "productive",
  "stackoverflow.com": "productive",
  "youtube.com": "unproductive",
  "facebook.com": "unproductive",
  "instagram.com": "unproductive",
  "twitter.com": "unproductive",
  "x.com": "unproductive"
};

// ==============================
// Core load function
// ==============================

async function loadData() {
  const todayKey = getTodayKey();
  const summaryEl = document.getElementById("summary");
  const listEl = document.getElementById("list");

  // Read today's data from local storage
  const todayData = await new Promise((resolve) => {
    chrome.storage.local.get(todayKey, (res) => resolve(res[todayKey] || {}));
  });

  // Read user categories from sync storage
  const userCategories = await new Promise((resolve) => {
    chrome.storage.sync.get("userCategories", (res) =>
      resolve(res.userCategories || {})
    );
  });

  const categories = { ...DEFAULT_CATEGORIES, ...userCategories };
  const domains = Object.keys(todayData);

  // Clear previous UI
  listEl.innerHTML = "";

  if (!domains.length) {
    summaryEl.textContent = "No data yet for today.";
    return;
  }

  // Recompute categories + totals
  let total = 0;
  let productive = 0;
  let unproductive = 0;

  domains.forEach((domain) => {
    const entry = todayData[domain];
    const cat = categories[domain] || "uncategorized";

    entry.category = cat; // store back into object so we can use it below

    total += entry.totalSeconds;
    if (cat === "productive") productive += entry.totalSeconds;
    else if (cat === "unproductive") unproductive += entry.totalSeconds;
  });

  const score = total ? Math.round((productive / total) * 100) : 0;
  summaryEl.textContent = `Total: ${formatTime(
    total
  )} · Productivity: ${score}%`;

  // For bar width
  const max = Math.max(...domains.map((d) => todayData[d].totalSeconds));

  // Sort by time desc and show top 8
  domains
    .sort((a, b) => todayData[b].totalSeconds - todayData[a].totalSeconds)
    .slice(0, 8)
    .forEach((domain) => {
      const entry = todayData[domain];
      const cat = entry.category;

      const row = document.createElement("div");
      row.className = "site";

      // Top row: domain + time
      const top = document.createElement("div");
      top.className = "site-top";

      const nameSpan = document.createElement("span");
      nameSpan.className = "site-domain";
      nameSpan.textContent = domain;

      const timeSpan = document.createElement("span");
      timeSpan.className =
        "site-time " +
        (cat === "productive"
          ? "prod"
          : cat === "unproductive"
          ? "unprod"
          : "uncat");
      timeSpan.textContent = formatTime(entry.totalSeconds);

      top.appendChild(nameSpan);
      top.appendChild(timeSpan);

      // Progress bar
      const barShell = document.createElement("div");
      barShell.className = "progress-shell";

      const barFill = document.createElement("div");
      barFill.className = "progress-fill";
      barFill.style.width = `${(entry.totalSeconds / max) * 100}%`;

      barShell.appendChild(barFill);

      row.appendChild(top);
      row.appendChild(barShell);
      listEl.appendChild(row);
    });
}

// ==============================
// Init
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  // initial load
  loadData();

  // auto refresh every 5 seconds so popup updates while open
  setInterval(loadData, 5000);

  // sync button
  const syncBtn = document.getElementById("syncBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "SYNC_NOW" }, (res) => {
        alert(res && res.ok ? "Synced with server!" : "Sync failed");
      });
    });
  }
});
