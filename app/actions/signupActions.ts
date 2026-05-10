"use server";

import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function submitEmailSignup(
  email: string,
  source: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("email_signups")
    .insert({ email: email.trim().toLowerCase(), source });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You're already on the list." };
    }
    return { ok: false, error: "Something went wrong. Try again." };
  }

  return { ok: true };
}
