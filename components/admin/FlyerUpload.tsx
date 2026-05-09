"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

export default function FlyerUpload({ currentFlyer }: { currentFlyer: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(currentFlyer);
  const [dragging, setDragging] = useState(false);
  const supabase = createClient();

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }
    setUploading(true);
    setMessage("");

    const fileName = `flyer-${Date.now()}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("flyers")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setMessage("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("flyers")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("settings")
      .update({ current_flyer_url: urlData.publicUrl })
      .eq("id", 1);

    if (updateError) {
      setMessage("Failed to update flyer.");
    } else {
      setPreview(urlData.publicUrl);
      setMessage("Flyer updated successfully!");
    }

    setUploading(false);
    setTimeout(() => setMessage(""), 3000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div>
      <h2 style={sectionTitle}>Current Flyer</h2>

      {preview && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Image
            src={preview}
            alt="Current flyer"
            width={300}
            height={400}
            style={{
              width: "200px",
              height: "auto",
              borderRadius: "8px",
              border: "1px solid #222",
            }}
          />
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "#e63030" : "#333"}`,
          borderRadius: "8px",
          padding: "3rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s",
          background: dragging ? "#1a0000" : "#111",
        }}
        onClick={() => document.getElementById("flyer-input")?.click()}
      >
        <p style={{ color: "#aaa", marginBottom: "0.5rem" }}>
          {uploading ? "Uploading..." : "Drag and drop a flyer here"}
        </p>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>
          or click to browse
        </p>
        <input
          id="flyer-input"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </div>

      {message && (
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: message.includes("success") ? "#4caf50" : "#e63030",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  marginBottom: "1.5rem",
  color: "#fff",
};