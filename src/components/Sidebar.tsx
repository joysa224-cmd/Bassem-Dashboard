"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileSpreadsheet,
  LineChart,
  Wallet,
  ReceiptText,
  Upload,
  LogOut,
  Loader2,
  X,
  ListRestart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/components/DataProvider";

const NAV_ITEMS = [
  { href: "/income", label: "قائمة الدخل", icon: FileSpreadsheet },
  { href: "/analytics", label: "التحصيل والمدفوعات", icon: LineChart },
  { href: "/cashflow", label: "التدفقات النقدية", icon: Wallet },
  { href: "/expenses", label: "تحليل المصروفات", icon: ReceiptText },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { stage, uploadFile, fileName, sheetName, usedFallbackSheet, resetMapping } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      await uploadFile(file);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل تحميل الملف" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleResetMapping() {
    resetMapping();
    setMessage({ type: "success", text: "تم مسح الربط المحفوظ — سيتم طلب إعادة الربط عند رفع ملف جديد" });
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-40 flex h-screen w-64 shrink-0 -translate-x-full flex-col border-e border-gray-200 bg-white transition-transform rtl:translate-x-full lg:static lg:translate-x-0 rtl:lg:translate-x-0",
        open && "translate-x-0 rtl:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between gap-2.5 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            MT
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-gray-900">Modern Travel</span>
            <span className="text-xs text-gray-400">التحليلات المالية</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-gray-200 px-3 py-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || stage === "mapping-columns" || stage === "mapping-categories"}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Upload className="h-[18px] w-[18px]" />}
          {uploading ? "جاري القراءة..." : "رفع ملف Excel"}
        </button>

        {fileName && (
          <p className="truncate px-3 text-xs text-gray-400" title={fileName}>
            الملف الحالي: {fileName}
          </p>
        )}
        {sheetName && (
          <p className="truncate px-3 text-xs text-gray-400" title={sheetName}>
            الشيت: {sheetName}
            {usedFallbackSheet && (
              <span className="text-amber-600"> (أول شيت — لا يوجد &quot;trans&quot;)</span>
            )}
          </p>
        )}
        {fileName && (
          <button
            onClick={handleResetMapping}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ListRestart className="h-4 w-4" />
            إعادة ضبط ربط الأعمدة
          </button>
        )}
        {message && (
          <p
            className={cn(
              "px-3 text-xs",
              message.type === "success" ? "text-emerald-600" : "text-red-600"
            )}
          >
            {message.text}
          </p>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-[18px] w-[18px]" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
