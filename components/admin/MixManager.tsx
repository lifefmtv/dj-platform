"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface Mix {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  created_at: string;
  genre?: string;
}

const GENRES = [
  "DNB",
  "House",
  "Techno",
  "Jungle",
  "Dub",
  "Soul & Funk",
  "Tech House",
  "Other",
];

export default function MixManager() {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchMixes();
  }, []);

  async function fetchMixes() {
    const { data } = await supabase
      .from("mixes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMixes(data);
  }

  function showMsg(msg: string, error = false) {
    setMessage(msg);
    setIsError(error);
  }

  async function handleUpload(file: File) {
    if (!title.trim() || !artist.trim()) {
      showMsg("Please fill in the title and artist name first.", true);
      return;
    }
    if (mixes.length >= 10) {
      showMsg("Maximum 10 mixes reached. Delete one to add a new one.", true);
      return;
    }

    setUploading(true);
    showMsg("Uploading…");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `mix-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("mixes")
        .upload(fileName, file, {
          contentType: file.type || "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        showMsg(`Upload failed: ${uploadError.message}`, true);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("mixes")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("mixes").insert({
        title: title.trim(),
        artist: artist.trim(),
        audio_url: urlData.publicUrl,
        genre: genre || null,
      });

      if (insertError) {
        console.error("Database insert error:", insertError);
        showMsg(`Failed to save mix: ${insertError.message}`, true);
        return;
      }

      showMsg(`✓ "${title.trim()}" by ${artist.trim()} uploaded successfully!`);
      setTitle("");
      setArtist("");
      setGenre("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMixes();
    } catch (err) {
      console.error("Unexpected error:", err);
      showMsg(`Unexpected error: ${String(err)}`, true);
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  async function deleteMix(mix: Mix) {
    if (!confirm(`Delete "${mix.title}"?`)) return;
    const fileName = mix.audio_url.split("/").pop();
    if (fileName) await supabase.storage.from("mixes").remove([fileName]);
    await supabase.from("mixes").delete().eq("id", mix.id);
    fetchMixes();
  }

  const atLimit = mixes.length >= 10;

  return (
    <div>
      <h2 style={sectionTitle}>Mix Manager ({mixes.length}/10)</h2>

      <div style={formCard}>
        {/* Step 1 — details */}
        <p style={{ ...labelStyle, marginBottom: "1rem" }}>Step 1 — Enter mix details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Mix Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Late Night Sessions Vol. 3"
              style={inputStyle}
              disabled={atLimit || uploading}
            />
          </div>
          <div>
            <label style={labelStyle}>Artist *</label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. DJ Kellsy"
              style={inputStyle}
              disabled={atLimit || uploading}
            />
          </div>
          <div>
            <label style={labelStyle}>Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{ ...inputStyle, appearance: "none" }}
              disabled={atLimit || uploading}
            >
              <option value="">Select genre…</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2 — file */}
        {atLimit ? (
          <p style={{ color: "#e63030", fontSize: "0.9rem" }}>
            Maximum reached — delete a mix to add a new one.
          </p>
        ) : (
          <div style={{ borderTop: "1px solid #222", paddingTop: "1.25rem" }}>
            <p style={{ ...labelStyle, marginBottom: "1rem" }}>Step 2 — Choose your audio file</p>

            <div
              onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? "#e63030" : "#2a2a2a"}`,
                borderRadius: "8px",
                padding: "2rem",
                textAlign: "center",
                background: dragging ? "rgba(230,48,48,0.04)" : "#0a0a0a",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              {uploading ? (
                <>
                  <div style={uploadingSpinner} />
                  <p style={{ color: "#aaa", fontSize: "0.9rem", marginTop: "1rem", fontWeight: 600 }}>
                    Uploading…
                  </p>
                  <p style={{ color: "#555", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                    Please wait — do not close this page
                  </p>
                </>
              ) : (
                <>
                  {/* Label wraps the hidden input — most reliable cross-browser trigger */}
                  <label style={{ ...chooseButton, cursor: "pointer", display: "inline-block" }}>
                    🎵 Choose MP3 File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp3,audio/mpeg,audio/*"
                      style={{ display: "none" }}
                      disabled={uploading}
                      onChange={onFileChange}
                    />
                  </label>
                  <p style={{ color: "#444", fontSize: "0.75rem", marginTop: "1rem" }}>
                    or drag and drop here · MP3, WAV, AAC, FLAC · Max 10 mixes
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Message banner */}
        {message && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            background: isError ? "rgba(230,48,48,0.1)" : "rgba(34,197,94,0.1)",
            border: `1px solid ${isError ? "rgba(230,48,48,0.35)" : "rgba(34,197,94,0.35)"}`,
            color: isError ? "#ef9a9a" : "#81c784",
            fontSize: "0.85rem",
            fontFamily: "var(--font-mono)",
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Existing mixes */}
      {mixes.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          {mixes.map((mix) => (
            <div key={mix.id} style={mixRow}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, marginBottom: "0.1rem" }}>{mix.title}</p>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.1rem" }}>
                  <p style={{ color: "#e63030", fontSize: "0.8rem" }}>{mix.artist}</p>
                  {mix.genre && (
                    <span style={{ color: "#888", fontSize: "0.72rem", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                      {mix.genre}
                    </span>
                  )}
                </div>
                <p style={{ color: "#555", fontSize: "0.72rem", marginBottom: "0.6rem" }}>
                  {format(new Date(mix.created_at), "d MMM yyyy")}
                </p>
                <audio
                  controls
                  src={mix.audio_url}
                  style={{ width: "100%", accentColor: "#e63030" }}
                />
              </div>
              <button onClick={() => deleteMix(mix)} style={deleteButton}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {mixes.length === 0 && (
        <p style={{ color: "#444", fontSize: "0.85rem", marginTop: "1.25rem" }}>No mixes yet.</p>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  marginBottom: "1.5rem",
  color: "#fff",
};

const formCard: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1.5rem",
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

const chooseButton: React.CSSProperties = {
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "0.9rem 2.5rem",
  fontSize: "1rem",
  fontWeight: 700,
  letterSpacing: "0.02em",
};

const uploadingSpinner: React.CSSProperties = {
  width: "36px",
  height: "36px",
  border: "3px solid #222",
  borderTop: "3px solid #e63030",
  borderRadius: "50%",
  margin: "0 auto",
  animation: "spin 0.8s linear infinite",
};

const mixRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem 1.25rem",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "flex-start",
  gap: "1rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid rgba(230,48,48,0.4)",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.78rem",
  flexShrink: 0,
};
