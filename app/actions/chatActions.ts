"use server";

import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function deleteMessage(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("chat_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function clearAllMessages() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);
}

export async function banUser(displayName: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("banned_users")
    .insert({ display_name: displayName });
  if (error) throw new Error(error.message);
}

export async function unbanUser(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("banned_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function submitShowApplication(data: {
  full_name: string;
  dj_name: string;
  email: string;
  genre?: string;
  mix_link?: string;
  social_links?: string;
  availability?: string;
  about_show?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("show_applications").insert(data);
  if (error) throw new Error(error.message);
}
