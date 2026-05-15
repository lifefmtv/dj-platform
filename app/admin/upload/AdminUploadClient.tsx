"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import FlyerUpload from "@/components/admin/FlyerUpload";

const UPLOAD_TYPES = [
  { id: "flyer",   icon: "🎨", label: "Event Flyer",  desc: "JPG / PNG / WebP" },
  { id: "video",   icon: "🎬", label: "Video Show",   desc: "MP4 / MOV" },
  { id: "mix",     icon: "🎧", label: "DJ Mix",       desc: "MP3 / WAV / FLAC" },
  { id: "photo",   icon: "📸", label: "Photo",        desc: "JPG / PNG" },
] as const;

type UploadType = typeof UPLOAD_TYPES[number]["id"];

interface UploadLog {
  id: string;
  type: string;
  file_name: string;
  url: string;
  uploaded_at: string;
}

interface Props {
  currentFlyer: string | null;
}

export default function AdminUploadClient({ currentFlyer }: Props) {
  const [activeType, setActiveType] = useState<UploadType>("flyer");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [fileName, setFileName] = useState("");
  const [recentUploads] = useState<UploadLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  function flash(msg: string, ok = true) {
    setMessage(msg);
    setMessageOk(ok);
    setTimeout(() => setMessage(""), 4000);
  }

  const bucketFor: Record<UploadType, string> = {
    flyer: "flyers",
    video: "videos",
    mix:   "mixes",
    photo: "photos",
  };

  const acceptFor: Record<UploadType, string> = {
    flyer: "image/*",
    video: "video/mp4,video/quicktime,.mp4,.mov",
    mix:   "audio/mpeg,audio/wav,audio/flac,.mp3,.wav,.flac",
    photo: "image/*",
  };

  async function handleFile(file: File) {
    setUploading(true);
    setMessage("");
    const ext = file.name.split(".").pop();
    const slug = `${activeType}-${Date.now()}.${ext}`;
    const bucket = bucketFor[activeType];

    const { error } = await supabase.storage.from(bucket).upload(slug, file, { upsert: true });
    setUploading(false);

    if (error) {
      flash(`Upload failed: ${error.message}`, false);
      return;
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(slug);

    // Log to uploads_log if table exists (ignore error if table not created yet)
    await supabase.from("uploads_log").insert({
      type: activeType,
      file_name: file.name,
      url: pub.publicUrl,
    });

    flash(`${file.name} uploaded successfully.`);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">Studio Upload</div>
        <div className="admin-page-sub">Upload shows, mixes, flyers, and photos to LIFEFM storage.</div>
      </div>

      {/* Type selector */}
      <div className="admin-upload-types">
        {UPLOAD_TYPES.map(({ id, icon, label, desc }) => (
          <button
            key={id}
            type="button"
            className={`admin-upload-type${activeType === id ? " admin-upload-type--active" : ""}`}
            onClick={() => { setActiveType(id); setFileName(""); setMessage(""); }}
          >
            <span className="admin-upload-type-icon">{icon}</span>
            <span className="admin-upload-type-label">{label}</span>
            <span className="admin-upload-type-desc">{desc}</span>
          </button>
        ))}
      </div>

      {/* Flyer uses existing component */}
      {activeType === "flyer" ? (
        <FlyerUpload currentFlyer={currentFlyer} />
      ) : (
        <div className="admin-card">
          <div className="admin-card-title">
            {UPLOAD_TYPES.find((t) => t.id === activeType)?.icon}{" "}
            Upload {UPLOAD_TYPES.find((t) => t.id === activeType)?.label}
          </div>
          <div className="admin-card-sub">
            Accepted: {UPLOAD_TYPES.find((t) => t.id === activeType)?.desc}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptFor[activeType]}
              onChange={handleInputChange}
              style={{ display: "none" }}
            />
            <div
              style={{
                border: "2px dashed #2a2826",
                borderRadius: "10px",
                padding: "2.5rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.15s",
                marginBottom: "1rem",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                {UPLOAD_TYPES.find((t) => t.id === activeType)?.icon}
              </div>
              {fileName ? (
                <p style={{ color: "#f0edea", fontSize: "0.875rem", fontWeight: 600 }}>{fileName}</p>
              ) : (
                <p style={{ color: "#887f7a", fontSize: "0.875rem" }}>
                  Click to choose file
                </p>
              )}
            </div>

            {message && (
              <p style={{ fontSize: "0.82rem", color: messageOk ? "#22c55e" : "#e63030", marginBottom: "0.75rem" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="admin-btn"
              disabled={uploading || !fileName}
            >
              {uploading ? "Uploading…" : "Upload File"}
            </button>
          </form>
        </div>
      )}

      {/* Recent uploads */}
      {recentUploads.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-title">Recent Uploads</div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>File</th>
                <th>Uploaded</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.map((log) => (
                <tr key={log.id}>
                  <td><span className="admin-badge admin-badge--gray">{log.type}</span></td>
                  <td style={{ color: "#887f7a" }}>{log.file_name}</td>
                  <td style={{ color: "#484240" }}>{new Date(log.uploaded_at).toLocaleDateString()}</td>
                  <td>
                    <a href={log.url} target="_blank" rel="noreferrer" style={{ color: "#e63030", fontSize: "0.75rem" }}>
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
