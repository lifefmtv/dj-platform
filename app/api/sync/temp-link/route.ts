import { NextRequest, NextResponse } from "next/server";
import { getTemporaryLink } from "@/lib/dropbox";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Only allow requests from our own origin
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") ?? "";
  const allowed = [host, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean);
  const fromOurSite =
    allowed.some((a) => origin?.includes(a ?? "") || referer?.includes(a ?? "")) ||
    (!origin && !referer); // server-side / same-origin fetch

  if (!fromOurSite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const link = await getTemporaryLink(path);
    return NextResponse.json({ link });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
