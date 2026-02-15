"use client";

import { useEffect, useState } from "react";

interface ConfigData {
  config: {
    sophia?: { version: string; initialized: string };
    project?: { name: string; tech_stack: Record<string, string>; detected_at: string };
    user?: { experience_level: string; governance_level: string };
    agents?: { detected: { name: string; config_file: string; status: string }[] };
    session?: { auto_detect: boolean; stale_timeout_minutes: number; claim_mode: string };
    policies?: { enabled: string[]; strictness: string };
    teaching?: { enabled: boolean; show_explanations: boolean; first_time_hints: boolean };
    health?: { auto_score: boolean; score_on_commit: boolean };
  } | null;
}

export default function SettingsPage() {
  const [data, setData] = useState<ConfigData | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="empty-state"><p>Loading...</p></div>;
  if (!data.config) return <div className="empty-state"><h3>No Configuration</h3><p>Run sophia init first.</p></div>;

  const config = data.config;

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configuration from .sophia/config.yaml</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Project</div>
          <Setting label="Name" value={config.project?.name} />
          <Setting label="Language" value={config.project?.tech_stack.language} />
          <Setting label="Framework" value={config.project?.tech_stack.framework} />
          <Setting label="Test Runner" value={config.project?.tech_stack.test_runner} />
          <Setting label="Package Manager" value={config.project?.tech_stack.package_manager} />
        </div>

        <div className="card">
          <div className="card-header">User</div>
          <Setting label="Experience Level" value={config.user?.experience_level} />
          <Setting label="Governance Level" value={config.user?.governance_level} />
        </div>

        <div className="card">
          <div className="card-header">Agents</div>
          {config.agents?.detected.map((a) => (
            <div key={a.name} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
              <span>{a.name}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{a.config_file}</span>
                <span className={`badge ${a.status === "active" ? "badge-green" : "badge-dim"}`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">Sessions</div>
          <Setting label="Auto Detect" value={config.session?.auto_detect ? "yes" : "no"} />
          <Setting label="Stale Timeout" value={`${config.session?.stale_timeout_minutes} min`} />
          <Setting label="Claim Mode" value={config.session?.claim_mode} />
        </div>

        <div className="card">
          <div className="card-header">Policies</div>
          <Setting label="Strictness" value={config.policies?.strictness} />
          <Setting label="Enabled" value={config.policies?.enabled.join(", ")} />
        </div>

        <div className="card">
          <div className="card-header">Teaching</div>
          <Setting label="Enabled" value={config.teaching?.enabled ? "yes" : "no"} />
          <Setting label="Show Explanations" value={config.teaching?.show_explanations ? "yes" : "no"} />
          <Setting label="First Time Hints" value={config.teaching?.first_time_hints ? "yes" : "no"} />
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-header">Sophia</div>
        <Setting label="Version" value={config.sophia?.version} />
        <Setting label="Initialized" value={config.sophia?.initialized ? new Date(config.sophia.initialized).toLocaleString() : undefined} />
        <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-dim)" }}>
          Edit <code className="mono">.sophia/config.yaml</code> to change settings, then run <code className="mono">sophia sync</code>.
        </div>
      </div>
    </>
  );
}

function Setting({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>{label}</span>
      <span className="mono" style={{ fontSize: "0.875rem" }}>{value ?? "—"}</span>
    </div>
  );
}
