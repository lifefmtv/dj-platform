import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDJsClient from "./AdminDJsClient";

export default async function AdminDJsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  return <AdminDJsClient />;
}
