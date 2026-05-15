import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSponsorsClient from "./AdminSponsorsClient";

export default async function AdminSponsorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  return <AdminSponsorsClient />;
}
