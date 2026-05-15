"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

const TABS = [
  { id: "enquiries",    label: "Enquiries" },
  { id: "active",       label: "Active Sponsors" },
  { id: "availability", label: "Show Availability" },
] as const;

type Tab = typeof TABS[number]["id"];

type EnquiryStatus = "new" | "in_progress" | "confirmed" | "closed";

interface Enquiry {
  id: string;
  type: string;
  name: string;
  company: string | null;
  email: string;
  interest: string | null;
  message: string | null;
  show_name: string | null;
  payment_method: string | null;
  monthly_price: number | null;
  status: EnquiryStatus;
  created_at: string;
}

interface ShowAvailability {
  id: string;
  show_id: string;
  show_name: string;
  dj_name: string;
  day: string;
  time: string;
  is_available: boolean;
  sponsor_name: string | null;
}

export default function AdminSponsorsClient() {
  const [tab, setTab] = useState<Tab>("enquiries");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [shows, setShows] = useState<ShowAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (tab === "enquiries") fetchEnquiries();
    if (tab === "active") fetchEnquiries();
    if (tab === "availability") fetchShowAvailability();
  }, [tab]);

  async function fetchEnquiries() {
    setLoading(true);
    const { data } = await supabase
      .from("sponsor_enquiries")
      .select("id, type, name, company, email, interest, message, show_name, payment_method, monthly_price, status, created_at")
      .order("created_at", { ascending: false });
    if (data) setEnquiries(data as Enquiry[]);
    setLoading(false);
  }

  async function fetchShowAvailability() {
    setLoading(true);
    const { data } = await supabase
      .from("show_sponsorships")
      .select("id, show_id, show_name, dj_name, day, time, is_available, sponsor_name")
      .order("day")
      .order("time");
    if (data) setShows(data as ShowAvailability[]);
    setLoading(false);
  }

  async function updateEnquiryStatus(id: string, status: EnquiryStatus) {
    await supabase.from("sponsor_enquiries").update({ status }).eq("id", id);
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }

  async function toggleAvailability(id: string, current: boolean) {
    await supabase.from("show_sponsorships").update({ is_available: !current }).eq("id", id);
    setShows((prev) => prev.map((s) => s.id === id ? { ...s, is_available: !current } : s));
  }

  const statusBadge: Record<EnquiryStatus, string> = {
    new:         "admin-badge--yellow",
    in_progress: "admin-badge--red",
    confirmed:   "admin-badge--green",
    closed:      "admin-badge--gray",
  };

  const activeEnquiries = enquiries.filter((e) => e.status === "confirmed");
  const allEnquiries    = enquiries;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Sponsors</div>
        <div className="admin-page-sub">Manage sponsorship enquiries, active sponsors, and show availability.</div>
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

      {/* Enquiries */}
      {tab === "enquiries" && (
        loading ? (
          <p style={{ color: "#887f7a", fontSize: "0.82rem" }}>Loading…</p>
        ) : allEnquiries.length === 0 ? (
          <div className="admin-card">
            <p style={{ color: "#484240", fontSize: "0.82rem", fontStyle: "italic" }}>No enquiries yet.</p>
          </div>
        ) : (
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Interest</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allEnquiries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td style={{ color: "#887f7a" }}>{e.company ?? "—"}</td>
                    <td style={{ color: "#887f7a", fontSize: "0.75rem" }}>{e.email}</td>
                    <td>
                      {e.show_name ? (
                        <span className="admin-badge admin-badge--red">{e.show_name}</span>
                      ) : (
                        <span style={{ color: "#484240" }}>{e.interest ?? e.type}</span>
                      )}
                    </td>
                    <td style={{ color: "#484240" }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        value={e.status ?? "new"}
                        onChange={(ev) => updateEnquiryStatus(e.id, ev.target.value as EnquiryStatus)}
                        style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Active Sponsors */}
      {tab === "active" && (
        loading ? (
          <p style={{ color: "#887f7a", fontSize: "0.82rem" }}>Loading…</p>
        ) : activeEnquiries.length === 0 ? (
          <div className="admin-card">
            <p style={{ color: "#484240", fontSize: "0.82rem", fontStyle: "italic" }}>No confirmed sponsors yet. Mark an enquiry as Confirmed to see it here.</p>
          </div>
        ) : (
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Show</th>
                  <th>Package</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {activeEnquiries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td style={{ color: "#887f7a" }}>{e.company ?? "—"}</td>
                    <td style={{ color: "#887f7a", fontSize: "0.75rem" }}>{e.email}</td>
                    <td>{e.show_name ?? <span style={{ color: "#484240" }}>—</span>}</td>
                    <td>
                      {e.payment_method && (
                        <span className="admin-badge admin-badge--gray">{e.payment_method}</span>
                      )}
                    </td>
                    <td style={{ color: "#22c55e" }}>
                      {e.monthly_price ? `£${e.monthly_price}/mo` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Show Availability */}
      {tab === "availability" && (
        loading ? (
          <p style={{ color: "#887f7a", fontSize: "0.82rem" }}>Loading…</p>
        ) : shows.length === 0 ? (
          <div className="admin-card">
            <p style={{ color: "#484240", fontSize: "0.82rem", fontStyle: "italic" }}>
              No show sponsorship slots configured. Populate the <code style={{ fontFamily: "monospace" }}>show_sponsorships</code> table to manage availability.
            </p>
          </div>
        ) : (
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Show</th>
                  <th>DJ</th>
                  <th>Day / Time</th>
                  <th>Sponsor</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.show_name}</td>
                    <td style={{ color: "#887f7a" }}>{s.dj_name}</td>
                    <td style={{ color: "#484240" }}>{s.day} {s.time}</td>
                    <td>{s.sponsor_name ?? <span style={{ color: "#484240" }}>—</span>}</td>
                    <td>
                      <button
                        className={`admin-btn ${s.is_available ? "admin-btn--ghost" : "admin-btn--danger"}`}
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.72rem" }}
                        onClick={() => toggleAvailability(s.id, s.is_available)}
                      >
                        {s.is_available ? "Available" : "Sponsored"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
