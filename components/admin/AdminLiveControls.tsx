"use client";

import { resetVibeMeter, clearEmojiReactions } from "@/app/actions/interactionActions";

export default function AdminLiveControls() {
  async function handleResetVibe() {
    if (!confirm("Reset the Vibe Meter? This deletes all recent taps.")) return;
    await resetVibeMeter();
  }

  async function handleClearEmoji() {
    if (!confirm("Clear all emoji reactions?")) return;
    await clearEmojiReactions();
  }

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-title">Vibe Meter</div>
        <div className="admin-card-sub">Reset the live energy meter — clears all recent listener taps.</div>
        <button className="admin-btn admin-btn--warning" onClick={handleResetVibe}>
          Reset Vibe Meter
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">Emoji Reactions</div>
        <div className="admin-card-sub">Clear all current emoji reactions from the stream overlay.</div>
        <button className="admin-btn admin-btn--warning" onClick={handleClearEmoji}>
          Clear Emoji Reactions
        </button>
      </div>
    </div>
  );
}
