"use client";

import { useEffect, useState } from "react";

interface PolicyData {
  config: {
    policies?: { enabled: string[]; strictness: string };
  } | null;
}

export default function PoliciesPage() {
  const [data, setData] = useState<PolicyData | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="empty-state"><p>Loading...</p></div>;

  const policies = data.config?.policies;
  const policyNames = policies?.enabled ?? [];

  return (
    <>
      <div className="page-header">
        <h2>Policies</h2>
        <p>{policyNames.length} active policies &mdash; {policies?.strictness ?? "moderate"} strictness</p>
      </div>

      <div className="stack">
        {policyNames.map((name) => (
          <div key={name} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{name}</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  Loaded from .sophia/policies/{name}.yaml
                </p>
              </div>
              <span className="badge badge-green">active</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-header">Policy Commands</div>
        <div style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>
          <p><code className="mono">sophia policy list</code> &mdash; Show all rules</p>
          <p style={{ marginTop: "0.5rem" }}><code className="mono">sophia policy check &lt;file&gt;</code> &mdash; Check a specific file</p>
          <p style={{ marginTop: "0.5rem" }}><code className="mono">sophia policy check --staged</code> &mdash; Check git staged changes</p>
        </div>
      </div>
    </>
  );
}
