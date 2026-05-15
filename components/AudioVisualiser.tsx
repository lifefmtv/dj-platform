"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioReactive } from "@/context/AudioReactiveContext";

type UIState = "idle" | "prompt" | "requesting" | "denied" | "active";

export default function AudioVisualiser() {
  const { isActive, startVisualiser, stopVisualiser } = useAudioReactive();
  const [uiState, setUiState] = useState<UIState>("idle");
  const [showTooltip, setShowTooltip] = useState(false);
  const previouslyEnabled = useRef(false);

  // On mount: check localStorage preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    previouslyEnabled.current = localStorage.getItem("audio-visualiser") === "enabled";
  }, []);

  // Keep uiState in sync if the context deactivates externally
  useEffect(() => {
    if (!isActive && uiState === "active") setUiState("idle");
  }, [isActive, uiState]);

  const handleEnable = useCallback(async () => {
    setUiState("requesting");
    const result = await startVisualiser();
    if (result === "granted") {
      setUiState("active");
      localStorage.setItem("audio-visualiser", "enabled");
      previouslyEnabled.current = true;
    } else {
      setUiState("denied");
      localStorage.removeItem("audio-visualiser");
      previouslyEnabled.current = false;
    }
  }, [startVisualiser]);

  function handleDisable() {
    stopVisualiser();
    setUiState("idle");
    localStorage.removeItem("audio-visualiser");
    previouslyEnabled.current = false;
  }

  function handleButtonClick() {
    if (uiState === "active") {
      handleDisable();
      return;
    }
    if (uiState === "prompt" || uiState === "denied" || uiState === "requesting") {
      setUiState("idle");
      return;
    }
    // Returning users skip the prompt — they already consented
    if (previouslyEnabled.current) {
      handleEnable();
    } else {
      setUiState("prompt");
    }
  }

  const showPromptPanel = uiState === "prompt" || uiState === "denied" || uiState === "requesting";

  return (
    <div className="audio-vis-root">
      {/* Prompt / denied / requesting panel — appears above the button */}
      {showPromptPanel && (
        <div className="audio-vis-prompt">
          {uiState === "prompt" && (
            <>
              <p className="audio-vis-prompt-text">
                Enable audio visualiser? This uses your microphone to detect the
                music playing and create reactive visuals.{" "}
                <strong>No audio is recorded or stored.</strong>
              </p>
              <div className="audio-vis-prompt-actions">
                <button className="audio-vis-btn-enable" onClick={handleEnable}>
                  Enable
                </button>
                <button className="audio-vis-btn-later" onClick={() => setUiState("idle")}>
                  Maybe Later
                </button>
              </div>
            </>
          )}

          {uiState === "requesting" && (
            <p className="audio-vis-prompt-text">Requesting microphone access…</p>
          )}

          {uiState === "denied" && (
            <>
              <p className="audio-vis-prompt-text">
                Enable microphone access in your browser settings to use Visual Mode.
              </p>
              <button className="audio-vis-btn-later" onClick={() => setUiState("idle")}>
                OK
              </button>
            </>
          )}
        </div>
      )}

      {/* Main toggle button */}
      <button
        className={`audio-vis-button${isActive ? " audio-vis-button--active" : ""}`}
        onClick={handleButtonClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isActive ? "Disable Visual Mode" : "Enable Visual Mode"}
        aria-expanded={uiState === "prompt"}
      >
        {showTooltip && uiState === "idle" && (
          <span className="audio-vis-tooltip" role="tooltip">
            Sound Reactive Visuals
          </span>
        )}
        <span className="audio-vis-emoji" aria-hidden>🎵</span>
        {isActive && <span className="audio-vis-active-dot" aria-hidden />}
        <span className="audio-vis-label">Visual Mode</span>
      </button>
    </div>
  );
}
