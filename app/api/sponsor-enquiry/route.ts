import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = "general",
      name,
      company,
      email,
      interest,
      message,
      // Show booking fields
      showId,
      showName,
      djName,
      brandName,
      strapline,
      displayStyle,
      contactName,
      contactEmail,
      contactPhone,
      contactCompany,
      contactNotes,
      paymentMethod,
      monthlyPrice,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("sponsor_enquiries").insert({
      type,
      name: name ?? contactName ?? null,
      company: company ?? contactCompany ?? null,
      email: email ?? contactEmail,
      interest: interest ?? null,
      message: message ?? contactNotes ?? null,
      show_id: showId ?? null,
      show_name: showName ?? null,
      dj_name: djName ?? null,
      brand_name: brandName ?? null,
      strapline: strapline ?? null,
      display_style: displayStyle ?? null,
      contact_phone: contactPhone ?? null,
      payment_method: paymentMethod ?? null,
      monthly_price: monthlyPrice ?? null,
    });

    if (error) {
      console.error("[sponsor-enquiry] Supabase error:", error.message);
      // Return success anyway — don't expose DB errors to the client
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sponsor-enquiry] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
