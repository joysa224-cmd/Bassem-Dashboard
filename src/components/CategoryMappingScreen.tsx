"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ACCOUNT_CATEGORIES, ACCOUNT_CATEGORY_LABELS, type AccountCategoryOrNone } from "@/lib/types";

export function CategoryMappingScreen() {
  const { pendingAccountNames, categoryMapping, setCategoryMapping, confirmCategoryMapping, backToColumnMapping } =
    useData();

  const counts = useMemo(() => {
    const c: Record<AccountCategoryOrNone, number> = {
      revenue: 0,
      opex: 0,
      admin: 0,
      cashBank: 0,
      receivables: 0,
      payables: 0,
      unclassified: 0,
    };
    for (const name of pendingAccountNames) {
      const cat = categoryMapping[name] ?? "unclassified";
      c[cat] += 1;
    }
    return c;
  }, [pendingAccountNames, categoryMapping]);

  const emptyRequired = ACCOUNT_CATEGORIES.filter((cat) => counts[cat] === 0);

  function updateCategory(name: string, category: AccountCategoryOrNone) {
    setCategoryMapping({ ...categoryMapping, [name]: category });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ربط أسماء الحسابات بالتصنيفات</h1>
        <p className="text-sm text-gray-500">
          حدد تصنيف كل اسم حساب ظهر في الملف؛ الحسابات غير المصنفة لن تظهر في أي من لوحات التحليل
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACCOUNT_CATEGORIES.map((cat) => (
          <span key={cat} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {ACCOUNT_CATEGORY_LABELS[cat]}: {counts[cat]}
          </span>
        ))}
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
          غير مصنف: {counts.unclassified}
        </span>
      </div>

      {emptyRequired.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            لا يوجد أي حساب مصنف كـ: {emptyRequired.map((c) => ACCOUNT_CATEGORY_LABELS[c]).join("، ")} — الأقسام
            المرتبطة بها ستظهر بقيمة صفر في اللوحات.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>أسماء الحسابات ({pendingAccountNames.length})</CardTitle>
          <CardDescription>يمكن ربط أكثر من حساب بنفس التصنيف</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
                    اسم الحساب
                  </th>
                  <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
                    التصنيف
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingAccountNames.map((name) => (
                  <tr key={name}>
                    <td className="px-4 py-2 text-gray-700">{name}</td>
                    <td className="px-4 py-2">
                      <Select
                        value={categoryMapping[name] ?? "unclassified"}
                        onChange={(e) => updateCategory(name, e.target.value as AccountCategoryOrNone)}
                        className="h-9"
                      >
                        <option value="unclassified">غير مصنف</option>
                        {ACCOUNT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {ACCOUNT_CATEGORY_LABELS[cat]}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
            <Button variant="outline" onClick={backToColumnMapping}>
              رجوع
            </Button>
            <Button onClick={confirmCategoryMapping}>حفظ ومتابعة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
