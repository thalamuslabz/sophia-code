"use client";

import { useEffect, useState } from "react";

interface OverviewData {
  config: {
    project?: { name: string; tech_stack: { language: string; framework?: string; test_runner?: string } };
    user?: { experience_level: string; governance_level: string };
    policies?: { enabled: string[] };
  } | null;
  health: {
    overall_score: number;
    grade: string;
    categories: Record<string, { score: number }>;
  } | null;
  activeSessions: { id: string; agent: string; intent: string | null; started_at: string }[];
  recentBulletin: { entry_type: string; message: string; created_at: string }[];
  activeClaims: { session_id: string; pattern: string; claim_type: string }[];
  correctionCount: number;
  patternCount: number;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    fetch("/api/overview").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="empty-state"><p>Loading...</p></div>;
  if (!data.config) return <div className="empty-state"><h3>No Sophia Project</h3><p>Run &quot;sophia init&quot; in your project first.</p></div>;

  const project = data.config.project;
  const gradeClass = data.health ? `grade-${data.health.grade[0]}` : "";

  return (
    <>
      <div className="page-header">
        <h2>Overview</h2>
        <p>{project?.name} &mdash; {project?.tech_stack.language}{project?.tech_stack.framework ? ` + ${project.tech_stack.framework}` : ""}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <div className="card-header">Health Grade</div>
          <div className={`grade-display ${gradeClass}`}>{data.health?.grade ?? "N/A"}</div>
          <div className="stat-label">{data.health?.overall_score ?? 0}/100</div>
        </div>
        <div className="card">
          <div className="card-header">Active Sessions</div>
          <div className="stat-value">{data.activeSessions.length}</div>
          <div className="stat-label">agents working</div>
        </div>
        <div className="card">
          <div className="card-header">Active Claims</div>
          <div className="stat-value">{data.activeClaims.length}</div>
          <div className="stat-label">file patterns claimed</div>
        </div>
        <div className="card">
          <div className="card-header">Memory</div>
          <div className="stat-value">{data.correctionCount + data.patternCount}</div>
          <div className="stat-label">{data.correctionCount} corrections, {data.patternCount} patterns</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Health Categories</div>
          {data.health && Object.entries(data.health.categories).map(([name, cat]) => (
            <div key={name} style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                <span>{name}</span>
                <span className="mono" style={{ color: "var(--text-dim)" }}>{cat.score}/100</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${cat.score}%`,
                    background: cat.score >= 80 ? "var(--green)" : cat.score >= 60 ? "var(--yellow)" : "var(--red)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">Recent Activity</div>
          {data.recentBulletin.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No recent activity</p>
          ) : (
            data.recentBulletin.slice(0, 8).map((entry, i) => (
              <div key={i} className="feed-item">
                <div>{entry.message}</div>
                <div className="feed-time">{new Date(entry.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
