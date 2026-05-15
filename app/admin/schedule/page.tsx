import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminScheduleClient from "./AdminScheduleClient";

export default async function AdminSchedulePage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  return <AdminScheduleClient />;
}
