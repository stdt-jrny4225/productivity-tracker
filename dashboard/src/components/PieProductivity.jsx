import React from "react";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function PieProductivity({ productive, unproductive }) {
  const total = productive + unproductive;
  if (!total) return <div>No time tracked.</div>;

  const prodPercent = Math.round((productive / total) * 100);
  const unprodPercent = 100 - prodPercent;

  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Productive: {formatTime(productive)} ({prodPercent}%)
      </div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        Unproductive: {formatTime(unproductive)} ({unprodPercent}%)
      </div>

      <div
        style={{
          display: "flex",
          height: 14,
          borderRadius: 7,
          overflow: "hidden",
          border: "1px solid #ddd"
        }}
      >
        <div
          style={{
            width: `${prodPercent}%`,
            background: "#20bf6b"
          }}
        />
        <div
          style={{
            width: `${unprodPercent}%`,
            background: "#eb3b5a"
          }}
        />
      </div>
    </div>
  );
}
