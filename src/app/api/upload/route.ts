import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectWorkbookSheet } from "@/lib/dataProcessor";
import { saveExcelFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });
  }

  const validExt = /\.(xlsx|xls)$/i.test(file.name);
  if (!validExt) {
    return NextResponse.json({ error: "يجب أن يكون الملف بصيغة Excel (.xlsx)" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  let resolution: ReturnType<typeof detectWorkbookSheet>;
  try {
    resolution = detectWorkbookSheet(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "تعذر قراءة ملف Excel، تأكد من صحة الملف" }, { status: 400 });
  }

  if (!resolution) {
    return NextResponse.json({ error: "الملف لا يحتوي على أي شيتات" }, { status: 400 });
  }

  await saveExcelFile(Buffer.from(arrayBuffer), file.name);

  return NextResponse.json({
    ok: true,
    sheetName: resolution.sheetName,
    usedFallback: resolution.usedFallback,
  });
}
