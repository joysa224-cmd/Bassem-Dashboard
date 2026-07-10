import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "current.xlsx");
const LOCAL_META_FILE = path.join(LOCAL_DIR, "meta.json");
const BLOB_PATHNAME = "modern-travel/current.xlsx";

interface FileMeta {
  fileName: string;
  updatedAt: string;
}

function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveExcelFile(buffer: Buffer, fileName: string): Promise<void> {
  const meta: FileMeta = { fileName, updatedAt: new Date().toISOString() };

  if (hasBlobToken()) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATHNAME, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await put(`${BLOB_PATHNAME}.meta.json`, JSON.stringify(meta), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, buffer);
  await writeFile(LOCAL_META_FILE, JSON.stringify(meta));
}

export async function loadExcelFile(): Promise<{ buffer: Buffer; meta: FileMeta } | null> {
  if (hasBlobToken()) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    const fileBlob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!fileBlob) return null;

    const metaBlob = blobs.find((b) => b.pathname === `${BLOB_PATHNAME}.meta.json`);
    const [fileRes, metaRes] = await Promise.all([
      fetch(fileBlob.url, { cache: "no-store" }),
      metaBlob ? fetch(metaBlob.url, { cache: "no-store" }) : Promise.resolve(null),
    ]);
    if (!fileRes.ok) return null;

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const meta: FileMeta = metaRes && metaRes.ok
      ? await metaRes.json()
      : { fileName: "current.xlsx", updatedAt: fileBlob.uploadedAt?.toString() ?? "" };

    return { buffer, meta };
  }

  try {
    const buffer = await readFile(LOCAL_FILE);
    let meta: FileMeta = { fileName: "current.xlsx", updatedAt: "" };
    try {
      meta = JSON.parse(await readFile(LOCAL_META_FILE, "utf-8"));
    } catch {
      // no meta file yet
    }
    return { buffer, meta };
  } catch {
    return null;
  }
}
