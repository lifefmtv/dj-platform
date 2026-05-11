import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifefm.tv";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient();

  const { data: djs } = await supabase
    .from("djs")
    .select("slug")
    .eq("is_active", true);

  const djUrls: MetadataRoute.Sitemap = (djs ?? []).map((dj) => ({
    url: `${siteUrl}/djs/${dj.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: siteUrl,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${siteUrl}/schedule`,      lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${siteUrl}/shows`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${siteUrl}/mixes`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${siteUrl}/djs`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${siteUrl}/submit`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/label`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/shop`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    ...djUrls,
  ];
}
