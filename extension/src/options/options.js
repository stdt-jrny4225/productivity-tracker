const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const tableBody = document.querySelector("#domainTable tbody");
const newDomainInput = document.getElementById("newDomain");
const newCategorySelect = document.getElementById("newCategory");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");

// Turn "https://www.linkedin.com/feed" into "linkedin.com"
function normalizeDomain(input) {
  if (!input) return "";
  let value = input.trim().toLowerCase();

  try {
    // if looks like a URL, make sure it has protocol then parse
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const u = new URL(value);
      return u.hostname.replace(/^www\./, "");
    }

    // if it has a dot, treat as domain, prepend protocol to parse
    if (value.includes(".")) {
      const u = new URL("https://" + value);
      return u.hostname.replace(/^www\./, "");
    }

    // otherwise just return as-is
    return value;
  } catch (e) {
    return value;
  }
}

function renderTable(categories) {
  tableBody.innerHTML = "";
  Object.entries(categories).forEach(([domain, category]) => {
    const tr = document.createElement("tr");

    const tdDomain = document.createElement("td");
    tdDomain.textContent = domain;

    const tdCat = document.createElement("td");
    const select = document.createElement("select");
    ["productive", "unproductive", "uncategorized"].forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (opt === category) o.selected = true;
      select.appendChild(o);
    });
    tdCat.appendChild(select);

    tr.appendChild(tdDomain);
    tr.appendChild(tdCat);
    tableBody.appendChild(tr);
  });
}

function loadSettings() {
  chrome.storage.sync.get(["userCategories", "apiBaseUrl"], (res) => {
    const cats = res.userCategories || {};
    renderTable(cats);
    apiBaseUrlInput.value = res.apiBaseUrl || "http://localhost:5000";
  });
}

addBtn.addEventListener("click", () => {
  const rawDomain = newDomainInput.value;
  const domain = normalizeDomain(rawDomain);
  if (!domain) return;
  const category = newCategorySelect.value;

  chrome.storage.sync.get("userCategories", (res) => {
    const cats = res.userCategories || {};
    cats[domain] = category;
    chrome.storage.sync.set({ userCategories: cats }, loadSettings);
  });

  newDomainInput.value = "";
});

saveBtn.addEventListener("click", () => {
  const rows = tableBody.querySelectorAll("tr");
  const cats = {};

  rows.forEach((row) => {
    const rawDomain = row.children[0].textContent;
    const domain = normalizeDomain(rawDomain);
    const category = row.children[1].querySelector("select").value;
    cats[domain] = category;
  });

  chrome.storage.sync.set(
    { userCategories: cats, apiBaseUrl: apiBaseUrlInput.value.trim() },
    () => {
      alert("Settings saved");
      loadSettings(); // re-render with normalized domains like "linkedin.com"
    }
  );
});

loadSettings();
