import { NextRequest, NextResponse } from "next/server";
import { Dropbox } from "dropbox";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!origin.includes("vercel.app") && !origin.includes("lifefm.tv") && !origin.includes("localhost")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ connected: false, error: "DROPBOX_ACCESS_TOKEN is not set in environment variables" });
  }

  try {
    const dbx = new Dropbox({ accessToken: token, fetch: globalThis.fetch });
    const res = await dbx.usersGetCurrentAccount();
    const name = res.result.name?.display_name ?? res.result.email ?? "Connected";
    return NextResponse.json({ connected: true, accountName: name });
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    return NextResponse.json({ connected: false, error: msg });
  }
}
