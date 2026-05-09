"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface Mix {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  created_at: string;
}

type BannerType = "success" | "error";

export default function MixManager() {
  const supabase = useMemo(() => createClient(), []);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<BannerType>("success");

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

  function flash(msg: string, type: BannerType = "success") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3400);
  }

  async function handleUpload(file: File) {
    if (!title.trim() || !artist.trim()) {
      flash("Please fill in the title and artist before choosing a file.", "error");
      return;
    }
    if (mixes.length >= 10) {
      flash("Maximum 10 mixes reached. Delete one to add a new one.", "error");
      return;
    }

    const savedTitle = title.trim();
    const savedArtist = artist.trim();

    setUploading(true);
    setMessage("");

    const ext = file.name.split(".").pop();
    const fileName = `mix-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("mixes")
      .upload(fileName, file);

    if (uploadError) {
      flash("Upload failed. Please try again.", "error");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("mixes")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("mixes").insert({
      title: savedTitle,
      artist: savedArtist,
      audio_url: urlData.publicUrl,
    });

    setUploading(false);

    if (insertError) {
      flash("Upload succeeded but failed to save the record. Please try again.", "error");
    } else {
      flash(`Mix uploaded successfully — it will appear on the Mixes page\n${savedTitle} · ${savedArtist}`, "success");
      setTitle("");
      setArtist("");
      fetchMixes();
    }
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
        {/* Step 1: Details */}
        <p style={{ ...labelStyle, marginBottom: "1rem" }}>Step 1 — Enter mix details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Mix Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Late Night Sessions Vol. 3"
              style={inputStyle}
              disabled={atLimit}
            />
          </div>
          <div>
            <label style={labelStyle}>Artist *</label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. DJ Kellsy"
              style={inputStyle}
              disabled={atLimit}
            />
          </div>
        </div>

        {atLimit ? (
          <p style={{ color: "#e63030", fontSize: "0.9rem" }}>
            Maximum reached — delete a mix to add a new one.
          </p>
        ) : (
          <>
            {/* Step 2: File */}
            <div style={{ borderTop: "1px solid #222", paddingTop: "1.25rem" }}>
              <p style={{ ...labelStyle, marginBottom: "1rem" }}>
                Step 2 — Choose your audio file
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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
                  <div>
                    <div style={uploadingSpinner} />
                    <p style={{ color: "#aaa", fontSize: "0.9rem", marginTop: "1rem", fontWeight: 600 }}>
                      Uploading…
                    </p>
                    <p style={{ color: "#555", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                      Please wait, do not close this page
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => document.getElementById("audio-file-input")?.click()}
                      style={chooseButton}
                    >
                      🎵 Choose MP3 File
                    </button>
                    <p style={{ color: "#444", fontSize: "0.75rem", marginTop: "1rem" }}>
                      or drag and drop here · MP3, WAV, AAC, FLAC · Max 10 mixes
                    </p>
                  </>
                )}
                <input
                  id="audio-file-input"
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {message && (
          <div className={`admin-banner admin-banner--${messageType}`}>
            <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
            <span className="admin-banner-text" style={{ whiteSpace: "pre-line" }}>{message}</span>
          </div>
        )}
      </div>

      {/* Mixes list */}
      {mixes.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          {mixes.map((mix) => (
            <div key={mix.id} style={mixRow}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, marginBottom: "0.1rem" }}>{mix.title}</p>
                <p style={{ color: "#e63030", fontSize: "0.8rem", marginBottom: "0.1rem" }}>{mix.artist}</p>
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
  display: "inline-block",
  background: "#e63030",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "0.9rem 2.5rem",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
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
