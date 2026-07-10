"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useData } from "@/components/DataProvider";
import { getHeaderLabels, excelColumnLetter, norm } from "@/lib/dataProcessor";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ColumnMapping } from "@/lib/types";

const REQUIRED_FIELDS: { key: keyof Omit<ColumnMapping, "skipRows">; label: string }[] = [
  { key: "entryNo", label: "رقم القيد" },
  { key: "date", label: "التاريخ" },
  { key: "debit", label: "مدين" },
  { key: "credit", label: "دائن" },
  { key: "mainAccount", label: "الحساب الرئيسى" },
  { key: "subAccount", label: "الحساب الفرعى" },
  { key: "description", label: "شرح القيد" },
];

const OPTIONAL_FIELDS: { key: keyof Omit<ColumnMapping, "skipRows">; label: string }[] = [
  { key: "costCenter", label: "مركز التكلفة (اختياري)" },
];

export function ColumnMappingScreen() {
  const { pendingRows, pendingFileName, pendingSheetName, columnMapping, setColumnMapping, confirmColumnMapping, cancelMapping } =
    useData();
  const [touched, setTouched] = useState(false);

  const headerLabels = useMemo(() => {
    if (!pendingRows || !columnMapping) return [];
    return getHeaderLabels(pendingRows, columnMapping.skipRows);
  }, [pendingRows, columnMapping]);

  const previewRows = useMemo(() => {
    if (!pendingRows || !columnMapping) return [];
    return pendingRows.slice(columnMapping.skipRows + 1, columnMapping.skipRows + 4);
  }, [pendingRows, columnMapping]);

  if (!pendingRows || !columnMapping) return null;

  const missing = REQUIRED_FIELDS.filter((f) => columnMapping[f.key] < 0);
  const isValid = missing.length === 0;

  function updateField(key: keyof ColumnMapping, value: number) {
    setColumnMapping({ ...columnMapping!, [key]: value });
  }

  function handleNext() {
    setTouched(true);
    if (!isValid) return;
    confirmColumnMapping();
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ربط أعمدة الملف</h1>
        <p className="text-sm text-gray-500">حدد أي عمود يمثل كل بيان في ملفك حتى تعمل التحليلات بشكل صحيح</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm">{pendingFileName}</CardTitle>
            <CardDescription>الشيت: {pendingSheetName}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="skip-rows">عدد الصفوف التي سيتم تجاهلها في بداية الشيت</Label>
            <Select
              id="skip-rows"
              value={columnMapping.skipRows}
              onChange={(e) => updateField("skipRows", Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-400">الصف التالي مباشرة سيُعتبر صف العناوين</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {headerLabels.map((label, i) => (
                    <th key={i} className="whitespace-nowrap px-3 py-2 text-start font-semibold text-gray-600">
                      <div className="text-[10px] font-normal text-gray-400">{excelColumnLetter(i)}</div>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {headerLabels.map((_, ci) => (
                      <td key={ci} className="whitespace-nowrap px-3 py-1.5 text-gray-500">
                        {norm(row[ci]) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => {
              const isOptional = field.key === "costCenter";
              const invalid = touched && !isOptional && columnMapping[field.key] < 0;
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                  <Select
                    id={`field-${field.key}`}
                    value={columnMapping[field.key]}
                    onChange={(e) => updateField(field.key, Number(e.target.value))}
                    className={invalid ? "border-red-400" : undefined}
                  >
                    {isOptional && <option value={-1}>بدون</option>}
                    {!isOptional && <option value={-1}>— اختر عمود —</option>}
                    {headerLabels.map((label, i) => (
                      <option key={i} value={i}>
                        {excelColumnLetter(i)} — {label}
                      </option>
                    ))}
                  </Select>
                </div>
              );
            })}
          </div>

          {touched && !isValid && (
            <p className="text-sm text-red-600">
              الرجاء اختيار عمود لكل من: {missing.map((f) => f.label).join("، ")}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={cancelMapping}>
              إلغاء
            </Button>
            <Button onClick={handleNext}>التالي</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
