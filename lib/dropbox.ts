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

const DATE_RE = /(\d{1,2}[\s._-]\d{1,2}[\s._-]\d{2,4}|\d{4}[\s._-]\d{2}[\s._-]\d{2}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s._-]\d{2,4}\b)/i;

export function cleanFileName(raw: string): {
  title: string;
  djName: string | null;
  date: string | null;
} {
  // Strip extension
  const base = raw.replace(/\.[^.]+$/, "");
  // Normalise separators
  const norm = base.replace(/[._]/g, " ").replace(/-+/g, " - ");

  const dateMatch = norm.match(DATE_RE);
  const date = dateMatch ? dateMatch[0].trim() : null;
  const withoutDate = date ? norm.replace(date, "").trim() : norm;

  let djName: string | null = null;
  const lower = withoutDate.toLowerCase();
  for (const dj of KNOWN_DJS) {
    if (lower.includes(dj)) {
      // Title-case the matched portion
      djName = withoutDate.substring(lower.indexOf(dj), lower.indexOf(dj) + dj.length)
        .replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  // Collapse whitespace and strip trailing separators
  const title = withoutDate.replace(/\s{2,}/g, " ").replace(/^[\s-]+|[\s-]+$/g, "").trim();

  return { title, djName, date };
}
