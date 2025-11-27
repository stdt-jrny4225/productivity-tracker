import React, { useEffect, useState } from "react";
import { fetchSummary } from "../services/api";
import StatsCard from "../components/StatsCard";
import TimeBarChart from "../components/TimeBarChart";
import PieProductivity from "../components/PieProductivity";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // today range left empty => backend uses all data; you can pass dates if needed
    fetchSummary().then(setSummary);
  }, []);

  if (!summary) return <div>Loading...</div>;

  const productivityScore = summary.total
    ? Math.round((summary.productive / summary.total) * 100)
    : 0;

  const topDomains = [...summary.byDomain].sort(
    (a, b) => b.totalDuration - a.totalDuration
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Productivity Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        <StatsCard title="Total Time" value={formatTime(summary.total)} />
        <StatsCard
          title="Productive Time"
          value={formatTime(summary.productive)}
        />
        <StatsCard
          title="Unproductive Time"
          value={formatTime(summary.unproductive)}
        />
        <StatsCard
          title="Productivity Score"
          value={`${productivityScore}%`}
          subtitle="Higher is better"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 20
        }}
      >
        <div>
          <h2>Top Websites</h2>
          <TimeBarChart data={topDomains} />
        </div>
        <div>
          <h2>Productive vs Unproductive</h2>
          <PieProductivity
            productive={summary.productive}
            unproductive={summary.unproductive}
          />
        </div>
      </div>
    </div>
  );
}
