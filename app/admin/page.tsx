import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import TimetableManager from "@/components/admin/TimetableManager";
import FlyerUpload from "@/components/admin/FlyerUpload";
import MixManager from "@/components/admin/MixManager";
import ChatModeration from "@/components/admin/ChatModeration";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("current_flyer_url")
    .eq("id", 1)
    .single();

  return (
    <main style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Admin Dashboard</h1>
        <SignOutButton>
          <button
            style={{
              background: "transparent",
              color: "#aaa",
              border: "1px solid #333",
              borderRadius: "4px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Sign Out
          </button>
        </SignOutButton>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        <section
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <TimetableManager />
        </section>

        <section
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <FlyerUpload currentFlyer={settings?.current_flyer_url || null} />
        </section>

        <section
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <MixManager />
        </section>

        <section
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <ChatModeration />
        </section>
      </div>
    </main>
  );
}