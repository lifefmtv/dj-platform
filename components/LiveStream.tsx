export default function LiveStream() {
  const isLive = process.env.NEXT_PUBLIC_IS_LIVE === "true";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
        <iframe
          src="https://player.restream.io/?token=aac9fac0a8854d65b094b2d3c6b6d1de&vwrs=1"
          allow="autoplay"
          allowFullScreen
          frameBorder={0}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        />
      </div>
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
            zIndex: 10,
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
