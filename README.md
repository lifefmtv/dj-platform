# LIFEFM.TV — DJ Platform

Next.js 14 App Router site for LIFEFM.TV — live streaming radio, show archive, DJ profiles, and the Life For Music label.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Database / Realtime**: Supabase
- **Auth**: Clerk (admin routes only)
- **Styling**: Tailwind CSS + custom CSS in `app/globals.css`

## Environment Variables

Add these to Vercel (Settings → Environment Variables) and to a local `.env.local` for development.

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

### Optional — enables YouTube shows in the archive

| Variable | Description | How to get it |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | [console.cloud.google.com](https://console.cloud.google.com) → Enable APIs → YouTube Data API v3 → Credentials → Create API Key |
| `YOUTUBE_CHANNEL_ID` | LIFEFM.TV YouTube channel ID | YouTube channel → About → Share channel → Copy channel ID |

> Without `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` the shows archive falls back to Mixcloud only — no errors.

### Optional

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (defaults to `https://lifefm.tv`) |

## Getting started

```bash
npm install
npm run dev
```
