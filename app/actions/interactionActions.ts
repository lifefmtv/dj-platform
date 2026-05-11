"use server";

import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function createPoll(question: string, options: string[]) {
  const supabase = await createServerSupabaseClient();
  // Deactivate existing polls first
  await supabase.from("live_polls").update({ is_active: false }).eq("is_active", true);
  const { error } = await supabase.from("live_polls").insert({
    question: question.trim(),
    options: options.filter((o) => o.trim()),
    is_active: true,
  });
  return { ok: !error, error: error?.message };
}

export async function endPoll(pollId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("live_polls")
    .update({ is_active: false })
    .eq("id", pollId);
  return { ok: !error };
}

export async function deleteShoutout(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("shoutouts").delete().eq("id", id);
  return { ok: !error };
}

export async function resetVibeMeter() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("vibe_taps").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return { ok: !error };
}

export async function clearEmojiReactions() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("emoji_reactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return { ok: !error };
}
