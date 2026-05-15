import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminLiveClient from "./AdminLiveClient";

export default async function AdminLivePage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  return <AdminLiveClient />;
}
