const API_BASE_URL = "http://localhost:5000";

export async function fetchSummary(from, to, userId = "demo-user") {
  const params = new URLSearchParams({ userId });
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(`${API_BASE_URL}/api/logs/summary?${params}`);
  return res.json();
}

export async function fetchWeekly(userId = "demo-user") {
  const params = new URLSearchParams({ userId });
  const res = await fetch(`${API_BASE_URL}/api/logs/weekly-report?${params}`);
  return res.json();
}
