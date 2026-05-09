export default function LiveStream() {
  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL;
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#111" }}>
      <iframe
        src={streamUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "#e63030",
            color: "#fff",
            padding: "0.25rem 0.75rem",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            className="pulse-red"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
            }}
          />
          LIVE
        </div>
      )}
    </div>
  );
}