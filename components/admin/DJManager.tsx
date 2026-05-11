"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { GENRE_LIST } from "@/lib/genreColors";

interface DJ {
  id: string;
  name: string;
  slug: string;
  genre: string;
  show_name: string | null;
  show_schedule: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  twitter: string | null;
  mixcloud: string | null;
  soundcloud: string | null;
  is_resident: boolean;
  is_active: boolean;
}

type BannerType = "success" | "error";

const EMPTY_FORM = {
  name: "",
  slug: "",
  genre: "",
  show_name: "",
  show_schedule: "",
  bio: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  twitter: "",
  mixcloud: "",
  soundcloud: "",
  is_resident: false,
  is_active: true,
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function DJManager() {
  const supabase = useMemo(() => createClient(), []);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<BannerType>("success");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchDJs(); }, []);

  async function fetchDJs() {
    const { data } = await supabase
      .from("djs")
      .select("*")
      .order("name", { ascending: true });
    if (data) setDjs(data);
  }

  function flash(msg: string, type: BannerType = "success") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : toSlug(name),
    }));
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(false);
  }

  function startEdit(dj: DJ) {
    setForm({
      name: dj.name,
      slug: dj.slug,
      genre: dj.genre ?? "",
      show_name: dj.show_name ?? "",
      show_schedule: dj.show_schedule ?? "",
      bio: dj.bio ?? "",
      instagram: dj.instagram ?? "",
      facebook: dj.facebook ?? "",
      tiktok: dj.tiktok ?? "",
      twitter: dj.twitter ?? "",
      mixcloud: dj.mixcloud ?? "",
      soundcloud: dj.soundcloud ?? "",
      is_resident: dj.is_resident,
      is_active: dj.is_active,
    });
    setEditingId(dj.id);
    setPhotoFile(null);
    setPhotoPreview(dj.photo_url ?? null);
    setShowForm(true);
    setTimeout(() => document.getElementById("dj-form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const fileName = `dj-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("dj-photos")
      .upload(fileName, photoFile, { upsert: false, cacheControl: "3600" });
    if (error) { flash("Photo upload failed: " + error.message, "error"); return null; }
    const { data } = supabase.storage.from("dj-photos").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { flash("Name is required.", "error"); return; }
    if (!form.slug.trim()) { flash("Slug is required.", "error"); return; }
    if (!form.genre) { flash("Genre is required.", "error"); return; }

    setSaving(true);
    setMessage("");

    let photoUrl: string | null = null;
    if (photoFile) {
      setUploading(true);
      photoUrl = await uploadPhoto();
      setUploading(false);
      if (!photoUrl) { setSaving(false); return; }
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      genre: form.genre,
      show_name: form.show_name.trim() || null,
      show_schedule: form.show_schedule.trim() || null,
      bio: form.bio.trim() || null,
      instagram: form.instagram.trim() || null,
      facebook: form.facebook.trim() || null,
      tiktok: form.tiktok.trim() || null,
      twitter: form.twitter.trim() || null,
      mixcloud: form.mixcloud.trim() || null,
      soundcloud: form.soundcloud.trim() || null,
      is_resident: form.is_resident,
      is_active: form.is_active,
    };
    if (photoUrl) payload.photo_url = photoUrl;

    let error;
    if (editingId) {
      ({ error } = await supabase.from("djs").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("djs").insert(payload));
    }

    setSaving(false);
    if (error) {
      flash("Save failed: " + error.message, "error");
    } else {
      flash(editingId ? "DJ updated successfully." : `${form.name} added successfully.`, "success");
      resetForm();
      fetchDJs();
    }
  }

  async function toggleActive(dj: DJ) {
    await supabase.from("djs").update({ is_active: !dj.is_active }).eq("id", dj.id);
    fetchDJs();
  }

  async function deleteDJ(dj: DJ) {
    if (!confirm(`Delete "${dj.name}"? This cannot be undone.`)) return;
    if (dj.photo_url) {
      const fileName = dj.photo_url.split("/").pop();
      if (fileName) await supabase.storage.from("dj-photos").remove([fileName]);
    }
    await supabase.from("djs").delete().eq("id", dj.id);
    fetchDJs();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h2 style={sectionTitle}>DJ Manager ({djs.length})</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={addBtn}>+ Add DJ</button>
        )}
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div id="dj-form-top" style={formCard}>
          <p style={{ ...labelStyle, fontSize: "0.9rem", fontWeight: 700, marginBottom: "1.25rem", color: "#fff" }}>
            {editingId ? "Edit DJ Profile" : "New DJ Profile"}
          </p>

          {/* Row 1: Name / Slug / Genre */}
          <div style={grid3}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={form.name} onChange={(e) => onNameChange(e.target.value)} style={inputStyle} placeholder="DJ Name" />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} style={inputStyle} placeholder="dj-name" />
            </div>
            <div>
              <label style={labelStyle}>Genre *</label>
              <select value={form.genre} onChange={(e) => set("genre", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Select genre…</option>
                {GENRE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Show Name / Show Schedule */}
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Show Name</label>
              <input value={form.show_name} onChange={(e) => set("show_name", e.target.value)} style={inputStyle} placeholder="e.g. The Late Shift" />
            </div>
            <div>
              <label style={labelStyle}>Show Schedule</label>
              <input value={form.show_schedule} onChange={(e) => set("show_schedule", e.target.value)} style={inputStyle} placeholder="e.g. Every Friday 10pm–Midnight" />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              style={{ ...inputStyle, height: "100px", resize: "vertical" }}
              placeholder="A short bio about this DJ…"
            />
          </div>

          {/* Socials row */}
          <p style={{ ...labelStyle, marginBottom: "0.75rem", marginTop: "0.25rem" }}>Social Links</p>
          <div style={grid3}>
            <div>
              <label style={labelStyle}>Instagram</label>
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} style={inputStyle} placeholder="@handle" />
            </div>
            <div>
              <label style={labelStyle}>TikTok</label>
              <input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} style={inputStyle} placeholder="@handle" />
            </div>
            <div>
              <label style={labelStyle}>Twitter / X</label>
              <input value={form.twitter} onChange={(e) => set("twitter", e.target.value)} style={inputStyle} placeholder="@handle" />
            </div>
            <div>
              <label style={labelStyle}>Facebook URL</label>
              <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} style={inputStyle} placeholder="https://facebook.com/…" />
            </div>
            <div>
              <label style={labelStyle}>Mixcloud</label>
              <input value={form.mixcloud} onChange={(e) => set("mixcloud", e.target.value)} style={inputStyle} placeholder="@handle" />
            </div>
            <div>
              <label style={labelStyle}>SoundCloud URL</label>
              <input value={form.soundcloud} onChange={(e) => set("soundcloud", e.target.value)} style={inputStyle} placeholder="https://soundcloud.com/…" />
            </div>
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: "1rem", marginTop: "0.25rem" }}>
            <label style={labelStyle}>Profile Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {photoPreview && (
                <div style={{ width: 72, height: 72, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#1a1a1a" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div>
                <button onClick={() => photoInputRef.current?.click()} style={choosePhotoBtn}>
                  {uploading ? "Uploading…" : photoPreview ? "Change Photo" : "Choose Photo"}
                </button>
                <p style={{ color: "#555", fontSize: "0.72rem", marginTop: "0.4rem" }}>
                  JPG or PNG · Square crop recommended
                </p>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhotoChange} />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div style={{ display: "flex", gap: "2rem", marginBottom: "1.25rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#ccc" }}>
              <input type="checkbox" checked={form.is_resident} onChange={(e) => set("is_resident", e.target.checked)} />
              Resident DJ
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#ccc" }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              Active (visible on site)
            </label>
          </div>

          {message && (
            <div className={`admin-banner admin-banner--${messageType}`}>
              <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
              <span className="admin-banner-text">{message}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button onClick={handleSave} disabled={saving} style={saveBtn}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add DJ"}
            </button>
            <button onClick={resetForm} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Banner when form is hidden ── */}
      {!showForm && message && (
        <div className={`admin-banner admin-banner--${messageType}`}>
          <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
          <span className="admin-banner-text">{message}</span>
        </div>
      )}

      {/* ── DJ list ── */}
      {djs.length === 0 ? (
        <p style={{ color: "#444", fontSize: "0.85rem", marginTop: "1.25rem" }}>No DJs yet. Add one above.</p>
      ) : (
        <div style={{ marginTop: "1.5rem" }}>
          {djs.map((dj) => (
            <div key={dj.id} style={djRow}>
              {/* Photo thumbnail */}
              <div style={thumbWrap}>
                {dj.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dj.photo_url} alt={dj.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555", fontSize: "1.1rem", fontWeight: 700 }}>
                    {dj.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, color: "#fff" }}>{dj.name}</p>
                  <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "#666" }}>{dj.slug}</span>
                  {dj.genre && <span style={genrePill}>{dj.genre}</span>}
                  {dj.is_resident && <span style={residentPill}>Resident</span>}
                  <span style={{ fontSize: "0.68rem", color: dj.is_active ? "#22c55e" : "#555" }}>
                    {dj.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {dj.show_name && (
                  <p style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.15rem" }}>{dj.show_name}</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button onClick={() => toggleActive(dj)} style={toggleBtn(dj.is_active)}>
                  {dj.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => startEdit(dj)} style={editBtn}>Edit</button>
                <button onClick={() => deleteDJ(dj)} style={deleteButton}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#fff",
};

const addBtn: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.45rem 1rem",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
};

const formCard: React.CSSProperties = {
  background: "#0d0d0d",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "1rem",
  marginBottom: "1rem",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  color: "#888",
  marginBottom: "0.35rem",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.88rem",
  width: "100%",
  fontFamily: "inherit",
};

const choosePhotoBtn: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#ccc",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "0.45rem 1rem",
  fontSize: "0.82rem",
  cursor: "pointer",
};

const saveBtn: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "0.55rem 1.5rem",
  fontSize: "0.88rem",
  fontWeight: 700,
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  background: "transparent",
  color: "#888",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "0.55rem 1.25rem",
  fontSize: "0.88rem",
  cursor: "pointer",
};

const djRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "0.85rem 1rem",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const thumbWrap: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 6,
  overflow: "hidden",
  background: "#1a1a1a",
  flexShrink: 0,
};

const genrePill: React.CSSProperties = {
  fontSize: "0.64rem",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  background: "#1e1e1e",
  color: "#888",
  borderRadius: 3,
  padding: "0.1rem 0.4rem",
};

const residentPill: React.CSSProperties = {
  fontSize: "0.64rem",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  background: "rgba(230,48,48,0.12)",
  color: "#e63030",
  borderRadius: 3,
  padding: "0.1rem 0.4rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid rgba(230,48,48,0.4)",
  borderRadius: "4px",
  padding: "0.3rem 0.65rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  flexShrink: 0,
};

const editBtn: React.CSSProperties = {
  background: "transparent",
  color: "#aaa",
  border: "1px solid #333",
  borderRadius: "4px",
  padding: "0.3rem 0.65rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  flexShrink: 0,
};

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    background: "transparent",
    color: active ? "#f59e0b" : "#22c55e",
    border: `1px solid ${active ? "rgba(245,158,11,0.4)" : "rgba(34,197,94,0.4)"}`,
    borderRadius: "4px",
    padding: "0.3rem 0.65rem",
    cursor: "pointer",
    fontSize: "0.75rem",
    flexShrink: 0,
  };
}
