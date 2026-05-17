import { Dropbox } from "dropbox";

function getClient() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("DROPBOX_ACCESS_TOKEN not set");
  // Pass global fetch explicitly — required for Dropbox SDK v10 in Vercel/Node 18+
  return new Dropbox({ accessToken: token, fetch: globalThis.fetch });
}

export interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  client_modified: string;
}

export async function listFolder(folderPath: string): Promise<DropboxFile[]> {
  const dbx = getClient();
  const results: DropboxFile[] = [];

  let res = await dbx.filesListFolder({ path: folderPath, recursive: false });

  for (const entry of res.result.entries) {
    if (entry[".tag"] === "file") {
      results.push({
        id:              entry.id,
        name:            entry.name,
        path_lower:      entry.path_lower ?? "",
        size:            (entry as { size?: number }).size ?? 0,
        client_modified: (entry as { client_modified?: string }).client_modified ?? "",
      });
    }
  }

  while (res.result.has_more) {
    res = await dbx.filesListFolderContinue({ cursor: res.result.cursor });
    for (const entry of res.result.entries) {
      if (entry[".tag"] === "file") {
        results.push({
          id:              entry.id,
          name:            entry.name,
          path_lower:      entry.path_lower ?? "",
          size:            (entry as { size?: number }).size ?? 0,
          client_modified: (entry as { client_modified?: string }).client_modified ?? "",
        });
      }
    }
  }

  return results;
}

// Lists all entries (files AND folders) at a path — used for diagnostics.
// Pass "" for the Dropbox root.
export async function listFolderRaw(folderPath: string): Promise<{ name: string; tag: string }[]> {
  const dbx = getClient();
  const results: { name: string; tag: string }[] = [];

  let res = await dbx.filesListFolder({ path: folderPath, recursive: false });
  for (const entry of res.result.entries) {
    results.push({ name: entry.name, tag: entry[".tag"] });
  }
  while (res.result.has_more) {
    res = await dbx.filesListFolderContinue({ cursor: res.result.cursor });
    for (const entry of res.result.entries) {
      results.push({ name: entry.name, tag: entry[".tag"] });
    }
  }
  return results;
}

export async function getTemporaryLink(path: string): Promise<string> {
  const dbx = getClient();
  const res = await dbx.filesGetTemporaryLink({ path });
  return res.result.link;
}

const KNOWN_DJS = [
  "aphrodite", "kitch", "dj v", "paul roast", "mel lioness",
  "shy fx", "congo natty", "general levy", "zinc", "grooverider",
  "fabio", "goldie", "roni size", "ltj bukem", "a guy called gerald",
];

function toIso(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const yyyy = year < 100 ? 2000 + year : year;
  return `${yyyy}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(norm: string): { iso: string | null; stripped: string } {
  // DD MM YYYY — primary pattern: "16 12 2025", "5 8 2025"
  const dmyLong = norm.match(/\b(\d{1,2})\s+(\d{1,2})\s+(20\d{2})\b/);
  if (dmyLong) {
    const iso = toIso(+dmyLong[1], +dmyLong[2], +dmyLong[3]);
    if (iso) return { iso, stripped: norm.replace(dmyLong[0], "").trim() };
  }

  // YYYY-MM-DD or YYYY MM DD
  const ymd = norm.match(/\b(20\d{2})[\s._-](\d{2})[\s._-](\d{2})\b/);
  if (ymd) {
    const iso = toIso(+ymd[3], +ymd[2], +ymd[1]);
    if (iso) return { iso, stripped: norm.replace(ymd[0], "").trim() };
  }

  // DDMMYY compact (6 digits): "140526" → 14/05/2026
  const compact = norm.match(/\b(\d{2})(\d{2})(\d{2})\b/);
  if (compact) {
    const iso = toIso(+compact[1], +compact[2], +compact[3]);
    if (iso) return { iso, stripped: norm.replace(compact[0], "").trim() };
  }

  // Month-name: "Jan 2025", "January 2025"
  const monthName = norm.match(/\b(\d{1,2})[\s._-]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s._-]?(20\d{2}|\d{2})\b/i);
  if (monthName) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const m = months.indexOf(monthName[2].toLowerCase().slice(0,3)) + 1;
    const iso = toIso(+monthName[1], m, +monthName[3]);
    if (iso) return { iso, stripped: norm.replace(monthName[0], "").trim() };
  }

  return { iso: null, stripped: norm };
}

export function cleanFileName(raw: string, clientModified?: string): {
  title: string;
  djName: string | null;
  date: string | null;
} {
  // Strip extension
  const base = raw.replace(/\.[^.]+$/, "");
  // Normalise separators
  const norm = base.replace(/[._]/g, " ").replace(/-+/g, " - ");

  const { iso, stripped: withoutDate } = parseDate(norm);

  // Fall back to Dropbox file modified date when no date in filename
  let date: string | null = iso;
  if (!date && clientModified) {
    const d = new Date(clientModified);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().slice(0, 10);
    }
  }

  let djName: string | null = null;
  const lower = withoutDate.toLowerCase();
  for (const dj of KNOWN_DJS) {
    if (lower.includes(dj)) {
      djName = withoutDate.substring(lower.indexOf(dj), lower.indexOf(dj) + dj.length)
        .replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  // Collapse whitespace and strip trailing separators
  const title = withoutDate.replace(/\s{2,}/g, " ").replace(/^[\s-]+|[\s-]+$/g, "").trim();

  return { title, djName, date };
}
