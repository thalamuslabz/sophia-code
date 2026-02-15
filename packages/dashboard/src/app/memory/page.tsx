"use client";

import { useEffect, useState } from "react";

interface Correction {
  id: number;
  pattern: string;
  reason: string;
  correction: string;
  keywords: string;
  severity: string;
  times_applied: number;
  created_at: string;
}

interface Pattern {
  id: number;
  description: string;
  implementation: string;
  keywords: string;
  times_used: number;
  created_at: string;
}

interface Decision {
  id: number;
  decision: string;
  rationale: string | null;
  alternatives: string | null;
  created_at: string;
}

export default function MemoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d: { corrections: Correction[]; patterns: Pattern[]; decisions: Decision[] }) => {
        setCorrections(d.corrections);
        setPatterns(d.patterns);
        setDecisions(d.decisions);
      });
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Memory</h2>
        <p>{corrections.length} corrections, {patterns.length} patterns, {decisions.length} decisions</p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">Corrections (Past Mistakes)</div>
        {corrections.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No corrections recorded yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Severity</th>
                <th>Reason</th>
                <th>Fix</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((c) => (
                <tr key={c.id}>
                  <td>{c.pattern}</td>
                  <td>
                    <span className={`badge ${c.severity === "high" ? "badge-red" : c.severity === "medium" ? "badge-yellow" : "badge-dim"}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-dim)" }}>{c.reason}</td>
                  <td>{c.correction}</td>
                  <td className="mono">{c.times_applied}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">Patterns (What Worked)</div>
        {patterns.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No patterns recorded yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Implementation</th>
                <th>Keywords</th>
                <th>Used</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id}>
                  <td>{p.description}</td>
                  <td style={{ color: "var(--text-dim)" }}>{p.implementation}</td>
                  <td><span className="badge badge-blue">{p.keywords}</span></td>
                  <td className="mono">{p.times_used}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {decisions.length > 0 && (
        <div className="card">
          <div className="card-header">Decisions</div>
          <table className="table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Rationale</th>
                <th>Alternatives</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id}>
                  <td>{d.decision}</td>
                  <td style={{ color: "var(--text-dim)" }}>{d.rationale ?? "—"}</td>
                  <td style={{ color: "var(--text-dim)" }}>{d.alternatives ?? "—"}</td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
