import React from "react";

export default function StatsCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        minWidth: 160
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: "bold" }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
