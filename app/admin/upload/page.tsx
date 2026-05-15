import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AdminUploadClient from "./AdminUploadClient";

export default async function AdminUploadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  return <AdminUploadClient currentFlyer={settings?.current_flyer_url ?? null} />;
}
