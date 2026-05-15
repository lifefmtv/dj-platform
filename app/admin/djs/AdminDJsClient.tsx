"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import DJManager from "@/components/admin/DJManager";

const TABS = [
  { id: "djs",     label: "DJ Manager" },
  { id: "archive", label: "Archive Queue" },
] as const;

type Tab = typeof TABS[number]["id"];

interface ArchiveRecord {
  id: string;
  show_title: string;
  dj_name: string;
  recorded_at: string;
  status: "pending" | "approved" | "flagged" | "rejected";
  notes: string | null;
}

export default function AdminDJsClient() {
  const [tab, setTab] = useState<Tab>("djs");
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (tab === "archive") fetchArchive();
  }, [tab]);

  async function fetchArchive() {
    setLoading(true);
    const { data } = await supabase
      .from("show_archive")
      .select("id, show_title, dj_name, recorded_at, status, notes")
      .order("recorded_at", { ascending: false })
      .limit(100);
    if (data) setRecords(data as ArchiveRecord[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: ArchiveRecord["status"]) {
    await supabase.from("show_archive").update({ status }).eq("id", id);
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  const statusBadge: Record<ArchiveRecord["status"], string> = {
    pending:  "admin-badge--yellow",
    approved: "admin-badge--green",
    flagged:  "admin-badge--red",
    rejected: "admin-badge--gray",
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">DJs & Shows</div>
        <div className="admin-page-sub">Manage DJ profiles and review the show archive queue.</div>
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

      {tab === "djs" && <DJManager />}

      {tab === "archive" && (
        <div>
          {loading ? (
            <p style={{ color: "#887f7a", fontSize: "0.82rem" }}>Loading…</p>
          ) : records.length === 0 ? (
            <div className="admin-card">
              <p style={{ color: "#484240", fontSize: "0.82rem", fontStyle: "italic" }}>No archive submissions yet.</p>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Show</th>
                    <th>DJ</th>
                    <th>Recorded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.show_title}</td>
                      <td style={{ color: "#887f7a" }}>{r.dj_name}</td>
                      <td style={{ color: "#484240" }}>
                        {new Date(r.recorded_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`admin-badge ${statusBadge[r.status]}`}>{r.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {r.status !== "approved" && (
                            <button
                              className="admin-btn"
                              style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}
                              onClick={() => updateStatus(r.id, "approved")}
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== "flagged" && (
                            <button
                              className="admin-btn admin-btn--warning"
                              style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}
                              onClick={() => updateStatus(r.id, "flagged")}
                            >
                              Flag
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              className="admin-btn admin-btn--danger"
                              style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}
                              onClick={() => updateStatus(r.id, "rejected")}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
