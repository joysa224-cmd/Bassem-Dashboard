"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { DataPayload, Transaction } from "@/lib/types";

interface DataContextValue {
  transactions: Transaction[];
  fileName: string | null;
  updatedAt: string | null;
  sheetName: string | null;
  usedFallbackSheet: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [usedFallbackSheet, setUsedFallbackSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "تعذر تحميل البيانات");
      }
      const payload: DataPayload = await res.json();
      setTransactions(payload.transactions);
      setFileName(payload.fileName);
      setUpdatedAt(payload.updatedAt);
      setSheetName(payload.sheetName);
      setUsedFallbackSheet(payload.usedFallbackSheet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <DataContext.Provider
      value={{ transactions, fileName, updatedAt, sheetName, usedFallbackSheet, loading, error, refetch }}
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
