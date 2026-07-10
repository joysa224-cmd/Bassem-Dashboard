import { FileSpreadsheet, Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-gray-400">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">جاري تحميل البيانات...</p>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-24 text-center text-gray-400">
      <FileSpreadsheet className="h-10 w-10" />
      <p className="text-sm font-medium text-gray-500">
        {message ?? "لا توجد بيانات بعد"}
      </p>
      <p className="max-w-xs text-xs text-gray-400">
        قم برفع ملف Excel من القائمة الجانبية للبدء في عرض التحليلات المالية
      </p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-300 bg-red-50 py-24 text-center">
      <p className="text-sm font-medium text-red-600">{message}</p>
    </div>
  );
}
