export default function LiveStream() {
  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL;
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#0a0a0a",
      }}
    >
      <iframe
        src={streamUrl}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "var(--accent)",
            color: "#fff",
            padding: "0.3rem 0.8rem",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            boxShadow: "0 0 14px rgba(230,48,48,0.6)",
          }}
        >
          <span
            className="pulse-red"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          LIVE
        </div>
      )}
    </div>
  );
}
