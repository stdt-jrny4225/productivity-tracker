// ==============================
// CONFIG
// ==============================

// how long before Chrome considers you idle (seconds)
chrome.idle.setDetectionInterval(60);

// simple static user id for now
const USER_ID = "demo-user";

// default API base URL (can be overridden from options page)
const DEFAULT_API_BASE_URL = "http://localhost:5000";

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
// STATE
// ==============================

let currentTabId = null;
let currentDomain = null;
let lastActiveTime = Date.now();
let windowFocused = true;
let isIdle = false;

// ==============================
// HELPERS
// ==============================

function normalizeDomainKey(input) {
  if (!input) return "";
  let value = input.trim().toLowerCase();
  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const u = new URL(value);
      return u.hostname.replace(/^www\./, "");
    }
    if (value.includes(".")) {
      const u = new URL("https://" + value);
      return u.hostname.replace(/^www\./, "");
    }
    return value;
  } catch (e) {
    return value;
  }
}


function getDomainFromUrl(url) {
  try {
    const u = new URL(url);

    // ignore internal chrome / extension / edge pages
    if (
      u.protocol === "chrome:" ||
      u.protocol === "chrome-extension:" ||
      u.protocol === "edge:"
    ) {
      return null;
    }

    return u.hostname.replace(/^www\./i, "");
  } catch (e) {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// chrome.storage helpers
function storageGetLocal(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (res) => resolve(res[key]));
  });
}

function storageSetLocal(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => resolve());
  });
}

function storageGetSync(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (res) => resolve(res[key]));
  });
}

// read API base URL from options (or default)
async function getApiBaseUrl() {
  const saved = await storageGetSync("apiBaseUrl");
  return saved || DEFAULT_API_BASE_URL;
}

async function getCategories() {
  const userCategoriesRaw = (await storageGetSync("userCategories")) || {};

  const normalizedUserCats = {};
  Object.entries(userCategoriesRaw).forEach(([key, value]) => {
    const normKey = normalizeDomainKey(key);
    normalizedUserCats[normKey] = value;
  });

  return { ...DEFAULT_CATEGORIES, ...normalizedUserCats };
}

// ==============================
// CORE TIME TRACKING
// ==============================

async function saveTimeForCurrentDomain() {
  if (!currentDomain || !windowFocused || isIdle) return;

  const now = Date.now();
  const diffSeconds = Math.floor((now - lastActiveTime) / 1000);

  // ignore tiny intervals
  if (diffSeconds <= 2) {
    lastActiveTime = now;
    return;
  }

  const todayKey = getTodayKey();
  const categories = await getCategories();
  const category = categories[currentDomain] || "uncategorized";

  const todayData = (await storageGetLocal(todayKey)) || {};

  const existing = todayData[currentDomain] || {
    totalSeconds: 0,
    category
  };

  existing.totalSeconds += diffSeconds;
  existing.category = category;

  todayData[currentDomain] = existing;

  await storageSetLocal({ [todayKey]: todayData });

  lastActiveTime = now;
}

// when active tab changes
async function handleActiveTabChange(tabId) {
  await saveTimeForCurrentDomain();

  currentTabId = tabId;
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) {
      currentDomain = null;
      return;
    }
    const domain = getDomainFromUrl(tab.url);
    currentDomain = domain;
    lastActiveTime = Date.now();
  });
}

// when URL of current tab changes
async function handleTabUpdated(tabId, changeInfo, tab) {
  if (tabId !== currentTabId) return;
  if (changeInfo.status !== "complete" || !tab.url) return;

  await saveTimeForCurrentDomain();

  const domain = getDomainFromUrl(tab.url);
  currentDomain = domain;
  lastActiveTime = Date.now();
}

// when window focus changes
async function handleWindowFocusChange(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    windowFocused = false;
    await saveTimeForCurrentDomain();
  } else {
    windowFocused = true;
    lastActiveTime = Date.now();

    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;
      currentTabId = tab.id;
      currentDomain = getDomainFromUrl(tab.url);
    });
  }
}

// idle state changes
async function handleIdleStateChange(newState) {
  if (newState === "active") {
    isIdle = false;
    lastActiveTime = Date.now();
  } else {
    isIdle = true;
    await saveTimeForCurrentDomain();
  }
}

// ==============================
// BACKEND SYNC
// ==============================

async function syncTodayToServer() {
  const todayKey = getTodayKey();
  const todayData = (await storageGetLocal(todayKey)) || {};
  const domains = Object.keys(todayData);
  if (!domains.length) return;

  const payload = domains.map((domain) => ({
    userId: USER_ID,
    date: todayKey,
    hostname: domain,
    duration: todayData[domain].totalSeconds,
    category: todayData[domain].category || "uncategorized"
  }));

  try {
    const baseUrl = await getApiBaseUrl();
    await fetch(`${baseUrl}/api/logs/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: payload })
    });
    console.log("Synced logs to server");
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

// ==============================
// EVENT LISTENERS
// ==============================

chrome.tabs.onActivated.addListener((info) => {
  handleActiveTabChange(info.tabId);
});

chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.windows.onFocusChanged.addListener(handleWindowFocusChange);
chrome.idle.onStateChanged.addListener(handleIdleStateChange);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Productivity Time Tracker installed");
  chrome.alarms.create("syncLogs", { periodInMinutes: 5 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;
      currentTabId = tab.id;
      currentDomain = getDomainFromUrl(tab.url);
      lastActiveTime = Date.now();
    }
  );
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncLogs") {
    syncTodayToServer();
  }
});

// message from popup: manual sync
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SYNC_NOW") {
    syncTodayToServer().then(() => sendResponse({ ok: true }));
    return true; // keep channel open for async
  }
});

// safety: periodically save in case events are missed
setInterval(() => {
  saveTimeForCurrentDomain();
}, 5000);
