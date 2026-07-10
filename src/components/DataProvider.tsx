"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { parseExcelFile } from "@/lib/dataProcessor";
import { readStoredData, writeStoredData, clearStoredData } from "@/lib/localStore";
import type { DataPayload, Transaction } from "@/lib/types";

interface DataContextValue {
  transactions: Transaction[];
  fileName: string | null;
  updatedAt: string | null;
  sheetName: string | null;
  usedFallbackSheet: boolean;
  loading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<{ sheetName: string; usedFallback: boolean }>;
  clearData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const EMPTY: DataPayload = {
  transactions: [],
  fileName: null,
  updatedAt: null,
  sheetName: null,
  usedFallbackSheet: false,
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(readStoredData() ?? EMPTY);
    setLoading(false);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      throw new Error("يجب أن يكون الملف بصيغة Excel (.xlsx)");
    }

    const arrayBuffer = await file.arrayBuffer();

    let parsed: ReturnType<typeof parseExcelFile>;
    try {
      parsed = parseExcelFile(arrayBuffer);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "تعذر قراءة ملف Excel، تأكد من صحة الملف");
    }

    const payload: DataPayload = {
      transactions: parsed.transactions,
      fileName: file.name,
      updatedAt: new Date().toISOString(),
      sheetName: parsed.sheetName,
      usedFallbackSheet: parsed.usedFallback,
    };

    try {
      writeStoredData(payload);
    } catch {
      throw new Error("الملف كبير جدًا على مساحة التخزين المتاحة في المتصفح");
    }

    setData(payload);
    setError(null);
    return { sheetName: parsed.sheetName, usedFallback: parsed.usedFallback };
  }, []);

  const clearData = useCallback(() => {
    clearStoredData();
    setData(EMPTY);
  }, []);

  return (
    <DataContext.Provider
      value={{
        transactions: data.transactions,
        fileName: data.fileName,
        updatedAt: data.updatedAt,
        sheetName: data.sheetName,
        usedFallbackSheet: data.usedFallbackSheet,
        loading,
        error,
        uploadFile,
        clearData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
