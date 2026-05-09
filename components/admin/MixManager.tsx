"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";

interface Mix {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  created_at: string;
}

export default function MixManager() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

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

  async function handleUpload(file: File) {
    if (!title || !artist) {
      setMessage("Please fill in title and artist first.");
      return;
    }
    if (mixes.length >= 10) {
      setMessage("Maximum 10 mixes reached. Delete one to add a new one.");
      return;
    }
    setUploading(true);
    setMessage("");

    const fileName = `mix-${Date.now()}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("mixes")
      .upload(fileName, file);

    if (uploadError) {
      setMessage("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("mixes")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("mixes").insert({
      title,
      artist,
      audio_url: urlData.publicUrl,
    });

    if (insertError) {
      setMessage("Failed to save mix.");
    } else {
      setMessage("Mix uploaded successfully!");
      setTitle("");
      setArtist("");
      fetchMixes();
    }

    setUploading(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function deleteMix(mix: Mix) {
    if (!confirm(`Delete "${mix.title}"?`)) return;
    const fileName = mix.audio_url.split("/").pop();
    if (fileName) {
      await supabase.storage.from("mixes").remove([fileName]);
    }
    await supabase.from("mixes").delete().eq("id", mix.id);
    fetchMixes();
  }

  const atLimit = mixes.length >= 10;

  return (
    <div>
      <h2 style={sectionTitle}>Mix Manager ({mixes.length}/10)</h2>

      {/* Upload form */}
      <div style={formCard}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mix title"
              style={inputStyle}
              disabled={atLimit}
            />
          </div>
          <div>
            <label style={labelStyle}>Artist *</label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              style={inputStyle}
              disabled={atLimit}
            />
          </div>
        </div>

        {atLimit ? (
          <p style={{ color: "#e63030", fontSize: "0.9rem" }}>
            Delete a mix to add a new one.
          </p>
        ) : (
          <div>
            <label style={labelStyle}>Audio File *</label>
            <input
              type="file"
              accept="audio/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              style={{ ...inputStyle, padding: "0.4rem" }}
            />
          </div>
        )}

        {message && (
          <p style={{
            marginTop: "0.75rem",
            fontSize: "0.85rem",
            color: message.includes("success") ? "#4caf50" : "#e63030",
          }}>
            {uploading ? "Uploading..." : message}
          </p>
        )}
      </div>

      {/* Mixes list */}
      <div style={{ marginTop: "1.5rem" }}>
        {mixes.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.9rem" }}>No mixes yet.</p>
        ) : (
          mixes.map((mix) => (
            <div key={mix.id} style={mixRow}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{mix.title}</p>
                <p style={{ color: "#e63030", fontSize: "0.8rem" }}>{mix.artist}</p>
                <p style={{ color: "#555", fontSize: "0.75rem" }}>
                  {format(new Date(mix.created_at), "d MMM yyyy")}
                </p>
                <audio
                  controls
                  src={mix.audio_url}
                  style={{ width: "100%", marginTop: "0.5rem", accentColor: "#e63030" }}
                />
              </div>
              <button onClick={() => deleteMix(mix)} style={deleteButton}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
  fontSize: "0.8rem",
  color: "#aaa",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  width: "100%",
};

const mixRow: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "8px",
  padding: "1rem 1.5rem",
  marginBottom: "0.75rem",
  display: "flex",
  alignItems: "flex-start",
  gap: "1rem",
};

const deleteButton: React.CSSProperties = {
  background: "transparent",
  color: "#e63030",
  border: "1px solid #e63030",
  borderRadius: "4px",
  padding: "0.3rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
};