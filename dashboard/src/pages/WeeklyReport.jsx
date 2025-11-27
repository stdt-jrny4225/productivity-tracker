import React, { useEffect, useState } from "react";
import { fetchWeekly } from "../services/api";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function WeeklyReport() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchWeekly().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Weekly Productivity Report</h1>
      <p>
        Range: {data.from} → {data.to}
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 4 }}>Date</th>
            <th style={{ border: "1px solid #ddd", padding: 4 }}>
              Productive
            </th>
            <th style={{ border: "1px solid #ddd", padding: 4 }}>
              Unproductive
            </th>
            <th style={{ border: "1px solid #ddd", padding: 4 }}>Total</th>
            <th style={{ border: "1px solid #ddd", padding: 4 }}>
              Productivity Score
            </th>
          </tr>
        </thead>
        <tbody>
          {data.days.map((d) => (
            <tr key={d.date}>
              <td style={{ border: "1px solid #ddd", padding: 4 }}>{d.date}</td>
              <td style={{ border: "1px solid #ddd", padding: 4 }}>
                {formatTime(d.productive)}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 4 }}>
                {formatTime(d.unproductive)}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 4 }}>
                {formatTime(d.total)}
              </td>
              <td style={{ border: "1px solid #ddd", padding: 4 }}>
                {d.productivityScore}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.days.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 14 }}>
          This week you spent{" "}
          <strong>
            {formatTime(
              data.days.reduce((acc, d) => acc + d.productive, 0)
            )}
          </strong>{" "}
          on productive sites and{" "}
          <strong>
            {formatTime(
              data.days.reduce((acc, d) => acc + d.unproductive, 0)
            )}
          </strong>{" "}
          on unproductive sites.
        </p>
      )}
    </div>
  );
}
