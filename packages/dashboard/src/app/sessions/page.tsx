"use client";

import { useEffect, useState } from "react";

interface Session {
  id: string;
  agent: string;
  intent: string | null;
  status: string;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

interface Claim {
  id: number;
  session_id: string;
  pattern: string;
  claim_type: string;
  created_at: string;
  released_at: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d: { sessions: Session[]; claims: Claim[] }) => {
        setSessions(d.sessions);
        setClaims(d.claims);
      });
  }, []);

  const active = sessions.filter((s) => s.status === "active");
  const ended = sessions.filter((s) => s.status !== "active");

  return (
    <>
      <div className="page-header">
        <h2>Sessions</h2>
        <p>{active.length} active, {ended.length} ended</p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">Active Sessions</div>
        {active.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No active sessions</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Intent</th>
                <th>Claims</th>
                <th>Started</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {active.map((s) => (
                <tr key={s.id}>
                  <td><span className="badge badge-green">{s.agent}</span></td>
                  <td>{s.intent ?? <span style={{ color: "var(--text-muted)" }}>none</span>}</td>
                  <td>{claims.filter((c) => c.session_id === s.id && !c.released_at).length}</td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{new Date(s.started_at).toLocaleString()}</td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{new Date(s.last_activity_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">Recent Sessions</div>
        {ended.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No recent sessions</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Intent</th>
                <th>Status</th>
                <th>Started</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              {ended.slice(0, 20).map((s) => (
                <tr key={s.id}>
                  <td><span className="badge badge-dim">{s.agent}</span></td>
                  <td>{s.intent ?? <span style={{ color: "var(--text-muted)" }}>none</span>}</td>
                  <td><span className="badge badge-dim">{s.status}</span></td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{new Date(s.started_at).toLocaleString()}</td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{s.ended_at ? new Date(s.ended_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
