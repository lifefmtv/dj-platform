export const GENRE_COLORS: Record<string, string> = {
  DNB:          "#e63030",
  House:        "#6366f1",
  Techno:       "#1a1a2e",
  Jungle:       "#22c55e",
  Dub:          "#f59e0b",
  "Soul & Funk":"#ec4899",
  "Tech House": "#00d4ff",
  Other:        "#888",
};

export const GENRE_LIST = Object.keys(GENRE_COLORS);

export function genreColor(genre: string | null | undefined): string {
  return GENRE_COLORS[genre ?? ""] ?? GENRE_COLORS.Other;
}
