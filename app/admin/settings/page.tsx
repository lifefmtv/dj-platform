import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  return <AdminSettingsClient />;
}
