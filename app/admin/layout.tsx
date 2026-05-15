import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Unauthenticated: render children only (sign-in page handles itself;
  // protected pages redirect to /admin/sign-in via their own auth check)
  if (!userId) {
    return (
      <>
        <style>{`
          .site-nav, .mobile-bottom-nav { display: none !important; }
          body { padding-top: 0 !important; }
        `}</style>
        {children}
      </>
    );
  }

  const [user, supabase] = await Promise.all([
    currentUser(),
    createServerSupabaseClient(),
  ]);

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const role = roleRow?.role ?? "admin";

  return (
    <>
      <style>{`
        .site-nav, .mobile-bottom-nav { display: none !important; }
        body { padding-top: 0 !important; }
      `}</style>
      <div className="admin-root">
        <AdminSidebar email={email} role={role} />
        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
