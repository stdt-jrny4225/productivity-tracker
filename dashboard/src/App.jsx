import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import WeeklyReport from "./pages/WeeklyReport";

export default function App() {
  const [tab, setTab] = useState("today");

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: 8,
          padding: 10,
          borderBottom: "1px solid #ddd"
        }}
      >
        <button onClick={() => setTab("today")}>
          Today Dashboard
        </button>
        <button onClick={() => setTab("weekly")}>
          Weekly Report
        </button>
      </nav>

      {tab === "today" ? <Dashboard /> : <WeeklyReport />}
    </div>
  );
}
