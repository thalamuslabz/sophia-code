"use client";

import { useEffect, useState } from "react";

interface HealthData {
  report: {
    overall_score: number;
    grade: string;
    categories: Record<string, { score: number }>;
    timestamp: string;
  } | null;
  history: { overall_score: number; grade: string; created_at: string }[];
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="empty-state"><p>Loading...</p></div>;

  const report = data.report;
  const gradeClass = report ? `grade-${report.grade[0]}` : "";

  return (
    <>
      <div className="page-header">
        <h2>Health</h2>
        <p>Project health scoring and history</p>
      </div>

      {!report ? (
        <div className="empty-state">
          <h3>No Health Data</h3>
          <p>Run <code className="mono">sophia verify</code> to generate a health report.</p>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: "1rem" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div className="card-header">Overall Grade</div>
              <div className={`grade-display ${gradeClass}`} style={{ fontSize: "5rem" }}>{report.grade}</div>
              <div className="stat-label" style={{ fontSize: "1.1rem" }}>{report.overall_score}/100</div>
              <div style={{ marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Last checked: {new Date(report.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="card">
              <div className="card-header">Category Breakdown</div>
              {Object.entries(report.categories).map(([name, cat]) => {
                const color = cat.score >= 80 ? "var(--green)" : cat.score >= 60 ? "var(--yellow)" : "var(--red)";
                return (
                  <div key={name} style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span className="mono" style={{ color }}>{cat.score}/100</span>
                    </div>
                    <div className="progress-bar" style={{ height: "12px" }}>
                      <div className="progress-bar-fill" style={{ width: `${cat.score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {data.history.length > 1 && (
            <div className="card">
              <div className="card-header">Score History</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((entry, i) => {
                    const prev = data.history[i + 1];
                    const diff = prev ? entry.overall_score - prev.score : 0;
                    return (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: "0.85rem" }}>{new Date(entry.created_at).toLocaleString()}</td>
                        <td className="mono">{entry.overall_score}</td>
                        <td><span className={`grade-${entry.grade[0]}`} style={{ fontWeight: 700 }}>{entry.grade}</span></td>
                        <td>
                          {diff > 0 && <span style={{ color: "var(--green)" }}>+{diff}</span>}
                          {diff < 0 && <span style={{ color: "var(--red)" }}>{diff}</span>}
                          {diff === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
