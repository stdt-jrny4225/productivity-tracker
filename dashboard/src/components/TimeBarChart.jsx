import React from "react";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function TimeBarChart({ data }) {
  if (!data.length) return <div>No data.</div>;

  const max = Math.max(...data.map((d) => d.totalDuration));

  return (
    <div>
      {data.map((item) => (
        <div key={item.hostname} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12 }}>{item.hostname}</div>
          <div
            style={{
              height: 10,
              width: `${(item.totalDuration / max) * 100}%`,
              maxWidth: "100%",
              borderRadius: 4,
              background: "#4b7bec"
            }}
          />
          <div style={{ fontSize: 11, color: "#666" }}>
            {formatTime(item.totalDuration)} ({item.category})
          </div>
        </div>
      ))}
    </div>
  );
}
