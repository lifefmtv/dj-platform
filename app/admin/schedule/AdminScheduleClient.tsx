"use client";

import { useState } from "react";
import TimetableManager from "@/components/admin/TimetableManager";
import ShowTemplateManager from "@/components/admin/ShowTemplateManager";

const TABS = [
  { id: "timetable", label: "Timetable" },
  { id: "recurring", label: "Recurring Templates" },
  { id: "import",    label: "Import Excel" },
] as const;

type Tab = typeof TABS[number]["id"];

interface ImportResult {
  success?: boolean;
  fromExcel?: Record<string, number>;
  fromTemplates?: Record<string, number>;
  total?: number;
  skipped?: number;
  source?: string;
  errors?: string[];
  error?: string;
}

const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AdminScheduleClient() {
  const [tab, setTab] = useState<Tab>("timetable");
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function runImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/import-schedule", { method: "POST" });
      const json = await res.json() as ImportResult;
      setImportResult(json);
    } catch (e) {
      setImportResult({ error: (e as Error).message });
    }
    setImporting(false);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Schedule</div>
        <div className="admin-page-sub">Manage the live broadcast timetable, recurring show templates, and import from Mel&apos;s Excel file.</div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-tab${tab === id ? " admin-tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "timetable" && <TimetableManager />}
      {tab === "recurring"  && <ShowTemplateManager />}

      {tab === "import" && (
        <div className="admin-import-panel">
          <div className="admin-card">
            <div className="admin-card-title">Import from Excel</div>
            <div className="admin-card-sub">
              Reads the schedule spreadsheet from the Dropbox{" "}
              <code style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>/LIFEFM/Schedule</code>{" "}
              folder and upserts all 12 months into the schedule table.
              Re-importing is safe — existing rows are updated, not duplicated.
            </div>

            <div className="admin-import-workflow">
              <div className="admin-import-step">
                <span className="admin-import-step-num">1</span>
                <span>Mel updates the Excel file and drops it into Dropbox <code>/LIFEFM/Schedule</code></span>
              </div>
              <div className="admin-import-step">
                <span className="admin-import-step-num">2</span>
                <span>Click <strong>Import from Excel</strong> below — or wait for the 9am daily sync to pick it up automatically</span>
              </div>
              <div className="admin-import-step">
                <span className="admin-import-step-num">3</span>
                <span>The schedule page updates immediately — Mel never needs to touch the website</span>
              </div>
            </div>

            <button
              className="admin-btn admin-btn--large"
              onClick={runImport}
              disabled={importing}
              style={{ marginTop: "1rem" }}
            >
              {importing ? "Importing…" : "Import from Excel"}
            </button>

            {importing && (
              <div className="admin-import-progress">
                <div className="admin-import-spinner" />
                <span>Reading Dropbox, parsing Excel, upserting to Supabase…</span>
              </div>
            )}

            {importResult && (
              <div className={`admin-import-result${importResult.success ? " admin-import-result--ok" : " admin-import-result--err"}`}>
                {importResult.success ? (
                  <>
                    <p className="admin-import-result-headline">
                      ✓ {importResult.total?.toLocaleString()} slots imported
                      {importResult.skipped != null && importResult.skipped > 0 && (
                        <span style={{ opacity: 0.6, fontSize: "0.85em" }}> ({importResult.skipped} skipped)</span>
                      )}
                    </p>
                    {importResult.source && (
                      <p style={{ fontSize: "0.75rem", opacity: 0.55, margin: "0.25rem 0 0" }}>{importResult.source}</p>
                    )}

                    {/* Excel months */}
                    {importResult.fromExcel && Object.keys(importResult.fromExcel).length > 0 && (
                      <>
                        <p style={{ fontSize: "0.72rem", color: "#22c55e", margin: "0.75rem 0 0.35rem", fontWeight: 600 }}>
                          From Excel ({Object.values(importResult.fromExcel).reduce((s, n) => s + n, 0)} slots)
                        </p>
                        <div className="admin-import-months">
                          {MONTH_ORDER.filter((m) => importResult.fromExcel![m] != null).map((m) => (
                            <div key={m} className="admin-import-month-pill admin-import-month-pill--excel">
                              <span className="admin-import-month-name">{m}</span>
                              <span className="admin-import-month-count">{importResult.fromExcel![m]}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Template-generated months */}
                    {importResult.fromTemplates && Object.keys(importResult.fromTemplates).length > 0 && (
                      <>
                        <p style={{ fontSize: "0.72rem", color: "#887f7a", margin: "0.75rem 0 0.35rem", fontWeight: 600 }}>
                          Auto-generated from templates ({Object.values(importResult.fromTemplates).reduce((s, n) => s + n, 0)} slots)
                        </p>
                        <div className="admin-import-months">
                          {MONTH_ORDER.filter((m) => importResult.fromTemplates![m] != null).map((m) => (
                            <div key={m} className="admin-import-month-pill admin-import-month-pill--tpl">
                              <span className="admin-import-month-name">{m}</span>
                              <span className="admin-import-month-count">{importResult.fromTemplates![m]}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="admin-import-errors">
                        <p style={{ color: "#f59e0b", fontSize: "0.78rem", marginBottom: "0.25rem" }}>Warnings:</p>
                        {importResult.errors.map((e, i) => (
                          <p key={i} style={{ color: "#f59e0b", fontSize: "0.72rem" }}>{e}</p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: "#e63030" }}>Error: {importResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
