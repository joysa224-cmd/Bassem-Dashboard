import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseExcelFile } from "@/lib/dataProcessor";
import { loadExcelFile } from "@/lib/storage";
import type { DataPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const file = await loadExcelFile();
  if (!file) {
    const empty: DataPayload = { transactions: [], fileName: null, updatedAt: null };
    return NextResponse.json(empty);
  }

  try {
    const arrayBuffer = file.buffer.buffer.slice(
      file.buffer.byteOffset,
      file.buffer.byteOffset + file.buffer.byteLength
    );
    const transactions = parseExcelFile(arrayBuffer as ArrayBuffer);
    const payload: DataPayload = {
      transactions,
      fileName: file.meta.fileName,
      updatedAt: file.meta.updatedAt,
    };
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "تعذرت قراءة الملف" },
      { status: 500 }
    );
  }
}
