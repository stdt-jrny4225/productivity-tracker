// ==============================
// Popup.js - Enhanced
// ==============================

// ---------- Helpers ----------
function getDateKey(daysAgo = 0) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
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

function q(id) {
  return document.getElementById(id);
}

function storageLocalGet(key) {
  return new Promise((resolve) =>
    chrome.storage.local.get(key, (res) => resolve(res[key]))
  );
}

function storageSyncGet(key) {
  return new Promise((resolve) =>
    chrome.storage.sync.get(key, (res) => resolve(res[key]))
  );
}

// Default categories (fallback)
const DEFAULT_CATEGORIES = {
  "leetcode.com": "productive",
  "github.com": "productive",
  "stackoverflow.com": "productive",
  "youtube.com": "unproductive",
  "facebook.com": "unproductive",
  "instagram.com": "unproductive",
  "twitter.com": "unproductive",
  "x.com": "unproductive",
};

// ---------- Chart Drawer ----------
function drawMiniChart(containerId, domainData) {
  // domainData: [{ hostname, totalSeconds, category }, ...]
  const canvas = q(containerId);
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  // sizing
  const DPR = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 280;
  const height = canvas.clientHeight || 64;
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  ctx.scale(DPR, DPR);

  // clear
  ctx.clearRect(0, 0, width, height);

  if (!domainData || domainData.length === 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("No data to display", 8, 20);
    return;
  }

  // only top 5
  const data = domainData.slice(0, 5);
  const max = Math.max(...data.map((d) => d.totalSeconds), 1);

  const padding = 8;
  const barGap = 6;
  const barCount = data.length;
  const barHeight = (height - padding * 2 - (barCount - 1) * barGap) / barCount;
  let y = padding;

  data.forEach((d) => {
    // choose color by category
    let color = "#3b82f6"; // default blue
    if (d.category === "productive") color = "#16a34a";
    else if (d.category === "unproductive") color = "#ef4444";

    const w = Math.max(4, Math.round((d.totalSeconds / max) * (width - 100)));

    // background bar
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(ctx, 8, y, width - 16, barHeight, 6, true, false);

    // fill bar
    ctx.fillStyle = color;
    roundRect(ctx, 8, y, w, barHeight, 6, true, false);

    // text
    ctx.fillStyle = "#e6eef8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    const label = d.hostname.length > 20 ? d.hostname.slice(0, 18) + "…" : d.hostname;
    ctx.fillText(label, 12 + Math.min(w, 120), y + barHeight / 2);
    // right side time
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "right";
    ctx.fillText(formatTime(d.totalSeconds), width - 12, y + barHeight / 2);
    ctx.textAlign = "left";

    y += barHeight + barGap;
  });
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "undefined") r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ---------- Core loadData ----------
async function loadData() {
  const dayDropdown = q("dayDropdown");
  const daysAgo = dayDropdown ? parseInt(dayDropdown.value || "0", 10) : 0;
  const selectedKey = getDateKey(daysAgo);

  const summaryEl = q("summary");
  const listEl = q("list");

  // fetch data for selected day
  const todayData = (await storageLocalGet(selectedKey)) || {};

  // user categories
  const userCats = (await storageSyncGet("userCategories")) || {};
  const categories = { ...DEFAULT_CATEGORIES, ...userCats };

  listEl.innerHTML = "";

  const domains = Object.keys(todayData);
  if (!domains.length) {
    summaryEl.textContent = "No data for " + selectedKey;
    // clear chart
    const canvas = q("miniChart");
    if (canvas) {
      const ctx = canvas.getContext && canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText("No data to display", 8, 20);
      }
    }
    return;
  }

  // compute totals
  let total = 0,
    productive = 0,
    unproductive = 0;

  // normalize categories and build domain array
  const domainObjects = domains.map((domain) => {
    const entry = todayData[domain];
    const cat = categories[domain] || entry.category || "uncategorized";
    entry.category = cat;
    total += entry.totalSeconds || 0;
    if (cat === "productive") productive += entry.totalSeconds || 0;
    else if (cat === "unproductive") unproductive += entry.totalSeconds || 0;
    return {
      hostname: domain,
      totalSeconds: entry.totalSeconds || 0,
      category: cat,
    };
  });

  const score = total ? Math.round((productive / total) * 100) : 0;
  summaryEl.textContent = `${selectedKey} · Total: ${formatTime(total)} · Productivity: ${score}%`;

  // draw mini chart (top domains)
  const sortedForChart = domainObjects.sort((a, b) => b.totalSeconds - a.totalSeconds);
  drawMiniChart("miniChart", sortedForChart);

  // list UI (top 8)
  const max = Math.max(...domainObjects.map((d) => d.totalSeconds), 1);
  sortedForChart.slice(0, 8).forEach((d) => {
    const row = document.createElement("div");
    row.className = "site";

    const top = document.createElement("div");
    top.className = "site-top";

    const name = document.createElement("span");
    name.className = "site-domain";
    name.textContent = d.hostname;

    const time = document.createElement("span");
    time.className = "site-time " + (d.category === "productive" ? "prod" : d.category === "unproductive" ? "unprod" : "uncat");
    time.textContent = formatTime(d.totalSeconds);

    top.appendChild(name);
    top.appendChild(time);

    const barShell = document.createElement("div");
    barShell.className = "progress-shell";
    const barFill = document.createElement("div");
    barFill.className = "progress-fill";
    barFill.style.width = `${(d.totalSeconds / max) * 100}%`;

    barShell.appendChild(barFill);
    row.appendChild(top);
    row.appendChild(barShell);
    listEl.appendChild(row);
  });
}

// ---------- Clear logic (today / all) ----------
function setupClearButton() {
  const clearBtn = q("clearBtn");
  if (!clearBtn) return;

  clearBtn.addEventListener("click", async () => {
    // nicer UI: custom modal could be used, but prompt is simple & supported
    const choice = prompt(
      "What do you want to clear?\n\nType 'today' to clear only today's data\nType 'all' to clear ALL local history\n\nAnything else = cancel"
    );
    if (!choice) return;

    const normalized = choice.trim().toLowerCase();
    if (normalized === "today") {
      // determine selected day
      const dayDropdown = q("dayDropdown");
      const daysAgo = dayDropdown ? parseInt(dayDropdown.value || "0", 10) : 0;
      const key = getDateKey(daysAgo);
      chrome.storage.local.remove(key, () => {
        alert(`Cleared local data for ${key}`);
        loadData();
      });
    } else if (normalized === "all") {
      if (!confirm("Are you sure you want to clear ALL local history?")) return;
      chrome.storage.local.clear(() => {
        alert("Cleared ALL local data.");
        loadData();
      });
    } else {
      alert("Cancelled. Nothing was cleared.");
    }
  });
}

// ---------- Sync button ----------
function setupSyncButton() {
  const syncBtn = q("syncBtn");
  if (!syncBtn) return;
  syncBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SYNC_NOW" }, (res) => {
      if (res && res.ok) alert("Synced with server!");
      else alert("Sync request sent (check background logs).");
    });
  });
}

// ---------- Day navigation ----------
function setupDayNavigation() {
  const dayDropdown = q("dayDropdown");
  const prevBtn = q("prevBtn");
  const nextBtn = q("nextBtn");

  if (dayDropdown) {
    dayDropdown.addEventListener("change", () => loadData());
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (!dayDropdown) return;
      const v = Math.min(6, Math.max(0, parseInt(dayDropdown.value || "0", 10) + 1));
      dayDropdown.value = String(v);
      loadData();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!dayDropdown) return;
      const v = Math.min(6, Math.max(0, parseInt(dayDropdown.value || "0", 10) - 1));
      dayDropdown.value = String(v);
      loadData();
    });
  }
}

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  // ensure dropdown default 0 if exists
  const dayDropdown = q("dayDropdown");
  if (dayDropdown) dayDropdown.value = dayDropdown.value || "0";

  setupClearButton();
  setupSyncButton();
  setupDayNavigation();

  // initial render
  loadData();

  // auto refresh while popup is open
  const interval = setInterval(() => {
    loadData();
  }, 5000);

  // clear interval when popup unloads
  window.addEventListener("unload", () => clearInterval(interval));
});
