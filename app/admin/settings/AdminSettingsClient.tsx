"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

interface SyncLogEntry {
  id: string;
  synced_at: string;
  shows_found: number;
  mixes_found: number;
  flyers_found: number;
  photos_found: number;
  errors: string | null;
}

interface UserRow {
  id: string;
  user_id: string;
  email: string;
  role: string;
}

export default function AdminSettingsClient() {
  const [streamUrl, setStreamUrl] = useState("");
  const [streamSaving, setStreamSaving] = useState(false);
  const [streamMsg, setStreamMsg] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const [metroSort, setMetroSort] = useState("");
  const [metroAcc, setMetroAcc] = useState("");
  const [metroSaving, setMetroSaving] = useState(false);
  const [metroMsg, setMetroMsg] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [syncLog, setSyncLog]     = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState("");
  const [dbxCounts, setDbxCounts] = useState<Record<string, number>>({});
  const supabase = useMemo(() => createClient(), []);
  const dropboxConnected = typeof process !== "undefined"
    ? !!(process.env.NEXT_PUBLIC_DROPBOX_CONNECTED === "true")
    : false;

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchSyncLog();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (data) {
      setStreamUrl(data.stream_url ?? "");
      setAdminEmail(data.admin_email ?? "");
      setMetroSort(data.metro_sort_code ?? "");
      setMetroAcc(data.metro_account_number ?? "");
    }
  }

  async function fetchUsers() {
    const { data } = await supabase.from("user_roles").select("id, user_id, email, role").order("email");
    if (data) setUsers(data as UserRow[]);
  }

  async function fetchSyncLog() {
    const { data } = await supabase
      .from("sync_log")
      .select("id, synced_at, shows_found, mixes_found, flyers_found, photos_found, errors")
      .order("synced_at", { ascending: false })
      .limit(5);
    if (data) {
      setSyncLog(data as SyncLogEntry[]);
      // Use latest entry for counts
      const latest = (data as SyncLogEntry[])[0];
      if (latest) {
        setDbxCounts({
          shows:  latest.shows_found,
          mixes:  latest.mixes_found,
          flyers: latest.flyers_found,
          photos: latest.photos_found,
        });
      }
    }
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync/dropbox", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        flash(setSyncMsg, `Sync complete — ${json.counts.shows ?? 0} shows, ${json.counts.mixes ?? 0} mixes`);
        fetchSyncLog();
      } else {
        flash(setSyncMsg, "Sync failed — check server logs");
      }
    } catch {
      flash(setSyncMsg, "Sync request failed");
    }
    setSyncing(false);
  }

  function flash(setter: (v: string) => void, msg: string) {
    setter(msg);
    setTimeout(() => setter(""), 3500);
  }

  async function saveStreamUrl() {
    setStreamSaving(true);
    const { error } = await supabase.from("settings").update({ stream_url: streamUrl }).eq("id", 1);
    setStreamSaving(false);
    flash(setStreamMsg, error ? "Failed to save." : "Stream URL saved.");
  }

  async function saveAdminEmail() {
    setEmailSaving(true);
    const { error } = await supabase.from("settings").update({ admin_email: adminEmail }).eq("id", 1);
    setEmailSaving(false);
    flash(setEmailMsg, error ? "Failed to save." : "Admin email saved.");
  }

  async function savePayments() {
    setMetroSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({ metro_sort_code: metroSort, metro_account_number: metroAcc })
      .eq("id", 1);
    setMetroSaving(false);
    flash(setMetroMsg, error ? "Failed to save." : "Payment details saved.");
  }

  async function updateUserRole(id: string, role: string) {
    await supabase.from("user_roles").update({ role }).eq("id", id);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Settings</div>
        <div className="admin-page-sub">Station configuration, user access, and integrations.</div>
      </div>

      {/* Stream URL */}
      <div className="admin-card">
        <div className="admin-card-title">Stream URL</div>
        <div className="admin-card-sub">The iframe src used for the live stream player on the homepage.</div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <input
            className="admin-input"
            style={{ flex: 1 }}
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://player.restream.io/..."
          />
          <button
            className="admin-btn"
            onClick={saveStreamUrl}
            disabled={streamSaving}
            style={{ flexShrink: 0 }}
          >
            {streamSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {streamMsg && (
          <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.5rem" }}>{streamMsg}</p>
        )}
      </div>

      {/* Admin email */}
      <div className="admin-card">
        <div className="admin-card-title">Notification Email</div>
        <div className="admin-card-sub">Admin email address for sponsorship enquiries and booking notifications.</div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            className="admin-input"
            style={{ flex: 1 }}
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="lifefmhq@gmail.com"
          />
          <button className="admin-btn" onClick={saveAdminEmail} disabled={emailSaving} style={{ flexShrink: 0 }}>
            {emailSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {emailMsg && (
          <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.5rem" }}>{emailMsg}</p>
        )}
      </div>

      {/* Users */}
      <div className="admin-card">
        <div className="admin-card-title">User Access</div>
        <div className="admin-card-sub">Manage roles for admin users. Roles: owner, admin, moderator.</div>
        {users.length === 0 ? (
          <p style={{ color: "#484240", fontSize: "0.82rem", fontStyle: "italic" }}>
            No users in user_roles table yet.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>User ID</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.email}</td>
                  <td style={{ color: "#484240", fontSize: "0.72rem", fontFamily: "monospace" }}>
                    {u.user_id.slice(0, 16)}…
                  </td>
                  <td>
                    <select
                      className="admin-select"
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      style={{ fontSize: "0.75rem" }}
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="moderator">moderator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payments */}
      <div className="admin-card">
        <div className="admin-card-title">Payment Details — Metro Bank</div>
        <div className="admin-card-sub">
          Displayed to sponsors choosing bank transfer. Keep in sync with{" "}
          <code style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>.env.local</code>.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", color: "#887f7a", display: "block", marginBottom: "0.375rem" }}>Sort Code</label>
            <input
              className="admin-input"
              value={metroSort}
              onChange={(e) => setMetroSort(e.target.value)}
              placeholder="XX-XX-XX"
            />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "#887f7a", display: "block", marginBottom: "0.375rem" }}>Account Number</label>
            <input
              className="admin-input"
              value={metroAcc}
              onChange={(e) => setMetroAcc(e.target.value)}
              placeholder="XXXXXXXX"
            />
          </div>
        </div>
        <button className="admin-btn" onClick={savePayments} disabled={metroSaving}>
          {metroSaving ? "Saving…" : "Save Payment Details"}
        </button>
        {metroMsg && (
          <p style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "0.5rem" }}>{metroMsg}</p>
        )}
      </div>

      {/* Stripe */}
      <div className="admin-card">
        <div className="admin-card-title">Stripe Integration</div>
        <div className="admin-card-sub">Online card payments for show sponsorship bookings.</div>
        <p style={{ fontSize: "0.82rem", color: "#484240" }}>
          Stripe integration coming soon. Add <code style={{ fontFamily: "monospace" }}>STRIPE_SECRET_KEY</code> and{" "}
          <code style={{ fontFamily: "monospace" }}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment.
        </p>
      </div>

      {/* Dropbox */}
      <div className="admin-card">
        <div className="admin-card-title">Dropbox Integration</div>
        <div className="admin-card-sub">Syncs video shows, DJ mixes, flyers and photos from Dropbox every morning at 9am.</div>

        <div className="dropbox-status">
          <div className={`dropbox-status-dot ${dropboxConnected ? "dropbox-status-dot--ok" : "dropbox-status-dot--err"}`} />
          <span className="dropbox-status-label" style={{ color: dropboxConnected ? "#22c55e" : "#e63030" }}>
            {dropboxConnected ? "Connected" : "Not connected — set DROPBOX_ACCESS_TOKEN in environment"}
          </span>
        </div>

        {syncLog.length > 0 && (
          <div className="dropbox-folder-counts">
            {[
              { label: "Shows",  key: "shows" },
              { label: "Mixes",  key: "mixes" },
              { label: "Flyers", key: "flyers" },
              { label: "Photos", key: "photos" },
            ].map(({ label, key }) => (
              <div key={key} className="dropbox-folder-count">
                <span className="dropbox-folder-count-label">{label}</span>
                <span className="dropbox-folder-count-val">{dbxCounts[key] ?? "—"}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <button className="admin-btn" onClick={triggerSync} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
          {syncLog.length > 0 && (
            <span style={{ fontSize: "0.75rem", color: "#484240" }}>
              Last sync: {new Date(syncLog[0].synced_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
        </div>
        {syncMsg && <p style={{ fontSize: "0.78rem", color: "#22c55e", marginBottom: "0.5rem" }}>{syncMsg}</p>}

        {syncLog.length > 0 && (
          <div className="dropbox-sync-log">
            <p className="dropbox-sync-log-title">Sync Log</p>
            {syncLog.map((entry) => (
              <div key={entry.id} className="dropbox-sync-log-entry">
                <span className="dropbox-sync-log-time">
                  {new Date(entry.synced_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="dropbox-sync-log-counts">
                  {entry.shows_found}v · {entry.mixes_found}m · {entry.flyers_found}f · {entry.photos_found}p
                </span>
                {entry.errors && (
                  <span className="dropbox-sync-log-err">{entry.errors}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {syncLog.length === 0 && (
          <p style={{ fontSize: "0.78rem", color: "#484240" }}>No syncs yet. Click Sync Now to import files from Dropbox.</p>
        )}
      </div>
    </div>
  );
}
