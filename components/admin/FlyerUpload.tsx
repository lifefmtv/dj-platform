"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

type BannerType = "success" | "error";

export default function FlyerUpload({ currentFlyer }: { currentFlyer: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<BannerType>("success");
  const [preview, setPreview] = useState<string | null>(currentFlyer);
  const [dragging, setDragging] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(msg: string, type: BannerType = "success") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3400);
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      flash("Please upload an image file (JPG, PNG, WebP, etc.).", "error");
      return;
    }
    setUploading(true);
    setMessage("");

    const ext = file.name.split(".").pop();
    const fileName = `flyer-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("flyers")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      flash("Upload failed. Please try again.", "error");
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

    setUploading(false);

    if (updateError) {
      flash("Image uploaded but failed to save. Please try again.", "error");
    } else {
      setPreview(urlData.publicUrl);
      flash("Flyer saved and live on the homepage.", "success");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div>
      <h2 style={sectionTitle}>Current Event Flyer</h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#e63030" : "#444"}`,
          borderRadius: "8px",
          padding: "2.5rem 2rem",
          textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
          background: dragging ? "rgba(230,48,48,0.06)" : "#0d0d0d",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem", lineHeight: 1 }}>🖼️</div>
        <p style={{ color: uploading ? "#888" : "#ddd", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.35rem" }}>
          {uploading ? "Uploading…" : "Drop your flyer image here"}
        </p>
        <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          {uploading ? "Please wait" : "or click to choose a file from your computer"}
        </p>
        {!uploading && (
          <span style={chooseButton}>Choose Image</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </div>

      {/* Success / error banner */}
      {message && (
        <div className={`admin-banner admin-banner--${messageType}`}>
          <span className="admin-banner-icon">{messageType === "success" ? "✓" : "✕"}</span>
          <span className="admin-banner-text">{message}</span>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={previewLabel}>Current flyer</p>
          <Image
            src={preview}
            alt="Current event flyer"
            width={300}
            height={400}
            style={{ width: "180px", height: "auto", borderRadius: "6px", border: "1px solid #222", display: "block" }}
          />
        </div>
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

const chooseButton: React.CSSProperties = {
  display: "inline-block",
  background: "#e63030",
  color: "#fff",
  borderRadius: "4px",
  padding: "0.55rem 1.4rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const previewLabel: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "#555",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "0.75rem",
  fontFamily: "inherit",
};
