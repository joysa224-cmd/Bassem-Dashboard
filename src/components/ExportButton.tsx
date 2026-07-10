"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExportSheet {
  sheetName: string;
  rows: Record<string, string | number>[];
}

interface ExportButtonProps {
  fileName: string;
  getSheets: () => ExportSheet[];
  label?: string;
}

export function ExportButton({ fileName, getSheets, label = "تصدير إلى Excel" }: ExportButtonProps) {
  function handleExport() {
    const sheets = getSheets();
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName.slice(0, 31));
    }

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
