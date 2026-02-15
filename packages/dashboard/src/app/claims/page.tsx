"use client";

import { useEffect, useState } from "react";

interface Claim {
  id: number;
  session_id: string;
  pattern: string;
  claim_type: string;
  created_at: string;
  released_at: string | null;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d: { claims: Claim[] }) => setClaims(d.claims));
  }, []);

  const active = claims.filter((c) => !c.released_at);
  const released = claims.filter((c) => c.released_at);

  return (
    <>
      <div className="page-header">
        <h2>Claims</h2>
        <p>{active.length} active claims across file patterns</p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">Active Claims</div>
        {active.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No active claims</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Agent</th>
                <th>Type</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.pattern}</td>
                  <td><span className="badge badge-green">{c.session_id}</span></td>
                  <td><span className={`badge ${c.claim_type === "hard" ? "badge-red" : "badge-yellow"}`}>{c.claim_type}</span></td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">Released Claims</div>
        {released.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No released claims</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Agent</th>
                <th>Type</th>
                <th>Released</th>
              </tr>
            </thead>
            <tbody>
              {released.slice(0, 20).map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.pattern}</td>
                  <td><span className="badge badge-dim">{c.session_id}</span></td>
                  <td><span className="badge badge-dim">{c.claim_type}</span></td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{c.released_at ? new Date(c.released_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
