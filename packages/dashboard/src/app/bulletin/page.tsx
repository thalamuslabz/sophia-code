"use client";

import { useEffect, useState } from "react";

interface BulletinEntry {
  id: number;
  session_id: string | null;
  agent: string | null;
  entry_type: string;
  message: string;
  files: string | null;
  created_at: string;
}

export default function BulletinPage() {
  const [entries, setEntries] = useState<BulletinEntry[]>([]);

  useEffect(() => {
    fetch("/api/bulletin")
      .then((r) => r.json())
      .then((d: { entries: BulletinEntry[] }) => setEntries(d.entries));
  }, []);

  const typeColor: Record<string, string> = {
    file_change: "badge-blue",
    new_file: "badge-green",
    commit: "badge-green",
    session_start: "badge-green",
    session_end: "badge-dim",
    schema_change: "badge-yellow",
    conflict: "badge-red",
    decision: "badge-blue",
    manual: "badge-dim",
  };

  return (
    <>
      <div className="page-header">
        <h2>Bulletin Board</h2>
        <p>Activity feed from all agents and sessions</p>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">
            <h3>No Activity Yet</h3>
            <p>Activity will appear here as agents work on the project.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="feed-item">
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span className={`badge ${typeColor[entry.entry_type] ?? "badge-dim"}`}>{entry.entry_type}</span>
                <div style={{ flex: 1 }}>
                  <div>{entry.message}</div>
                  {entry.files && (
                    <div className="mono" style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                      Files: {JSON.parse(entry.files).join(", ")}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                    {entry.agent && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>by {entry.agent}</span>
                    )}
                    <span className="feed-time">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
