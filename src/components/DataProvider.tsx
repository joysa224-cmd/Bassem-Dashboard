"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  detectWorkbookSheet,
  readSheetAOA,
  getColumnCount,
  getHeaderLabels,
  getUniqueMainAccounts,
  buildTransactions,
} from "@/lib/dataProcessor";
import { guessColumnMapping, guessCategoryMapping } from "@/lib/mappingDefaults";
import {
  readStoredData,
  writeStoredData,
  clearStoredData,
  readSavedMapping,
  writeSavedMapping,
  clearSavedMapping,
} from "@/lib/localStore";
import type { CategoryMapping, ColumnMapping, DataPayload, Transaction } from "@/lib/types";

export type Stage = "loading" | "empty" | "mapping-columns" | "mapping-categories" | "ready";

interface PendingUpload {
  rows: unknown[][];
  fileName: string;
  sheetName: string;
  usedFallback: boolean;
}

interface DataContextValue {
  stage: Stage;
  transactions: Transaction[];
  fileName: string | null;
  updatedAt: string | null;
  sheetName: string | null;
  usedFallbackSheet: boolean;
  error: string | null;

  uploadFile: (file: File) => Promise<void>;

  pendingRows: unknown[][] | null;
  pendingFileName: string | null;
  pendingSheetName: string | null;
  columnMapping: ColumnMapping | null;
  setColumnMapping: (mapping: ColumnMapping) => void;
  confirmColumnMapping: () => void;

  pendingAccountNames: string[];
  categoryMapping: CategoryMapping;
  setCategoryMapping: (mapping: CategoryMapping) => void;
  confirmCategoryMapping: () => void;

  backToColumnMapping: () => void;
  cancelMapping: () => void;
  clearData: () => void;
  resetMapping: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const EMPTY: DataPayload = {
  transactions: [],
  fileName: null,
  updatedAt: null,
  sheetName: null,
  usedFallbackSheet: false,
};

const DEFAULT_SKIP_ROWS = 4;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [data, setData] = useState<DataPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [pendingAccountNames, setPendingAccountNames] = useState<string[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<CategoryMapping>({});

  useEffect(() => {
    const stored = readStoredData();
    if (stored && stored.transactions.length > 0) {
      setData(stored);
      setStage("ready");
    } else {
      setStage("empty");
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      throw new Error("يجب أن يكون الملف بصيغة Excel (.xlsx)");
    }

    const arrayBuffer = await file.arrayBuffer();

    let resolution: ReturnType<typeof detectWorkbookSheet>;
    try {
      resolution = detectWorkbookSheet(arrayBuffer);
    } catch {
      throw new Error("تعذر قراءة ملف Excel، تأكد من صحة الملف");
    }
    if (!resolution) {
      throw new Error("الملف لا يحتوي على أي شيتات");
    }

    const rows = readSheetAOA(arrayBuffer, resolution.sheetName);
    if (rows.length === 0) {
      throw new Error("الشيت المحدد فارغ");
    }

    const savedMapping = readSavedMapping();

    if (savedMapping) {
      const colCount = getColumnCount(rows);
      const indices = Object.values(savedMapping.columnMapping).filter((v) => typeof v === "number" && v >= 0);
      const withinBounds = indices.every((i) => i < colCount) && savedMapping.columnMapping.skipRows < rows.length;

      if (withinBounds) {
        const uniqueAccounts = getUniqueMainAccounts(rows, savedMapping.columnMapping);
        const allKnown = uniqueAccounts.every((name) => name in savedMapping.categoryMapping);

        if (allKnown) {
          const transactions = buildTransactions(rows, savedMapping.columnMapping, savedMapping.categoryMapping);
          const payload: DataPayload = {
            transactions,
            fileName: file.name,
            updatedAt: new Date().toISOString(),
            sheetName: resolution.sheetName,
            usedFallbackSheet: resolution.usedFallback,
          };
          writeStoredData(payload);
          setData(payload);
          setStage("ready");
          return;
        }
      }
    }

    const skipRows = savedMapping?.columnMapping.skipRows ?? DEFAULT_SKIP_ROWS;
    const clampedSkipRows = Math.min(skipRows, Math.max(rows.length - 1, 0));
    const headerLabels = getHeaderLabels(rows, clampedSkipRows);
    const guessed = guessColumnMapping(headerLabels, clampedSkipRows);

    setPending({
      rows,
      fileName: file.name,
      sheetName: resolution.sheetName,
      usedFallback: resolution.usedFallback,
    });
    setColumnMapping(savedMapping?.columnMapping ?? guessed);
    setStage("mapping-columns");
  }, []);

  const confirmColumnMapping = useCallback(() => {
    if (!pending || !columnMapping) return;
    const uniqueAccounts = getUniqueMainAccounts(pending.rows, columnMapping);
    const saved = readSavedMapping();
    const guessed = guessCategoryMapping(uniqueAccounts);
    const merged: CategoryMapping = {};
    for (const name of uniqueAccounts) {
      merged[name] = saved?.categoryMapping[name] ?? guessed[name] ?? "unclassified";
    }
    setPendingAccountNames(uniqueAccounts);
    setCategoryMapping(merged);
    setStage("mapping-categories");
  }, [pending, columnMapping]);

  const confirmCategoryMapping = useCallback(() => {
    if (!pending || !columnMapping) return;
    const transactions = buildTransactions(pending.rows, columnMapping, categoryMapping);
    const payload: DataPayload = {
      transactions,
      fileName: pending.fileName,
      updatedAt: new Date().toISOString(),
      sheetName: pending.sheetName,
      usedFallbackSheet: pending.usedFallback,
    };
    writeStoredData(payload);
    writeSavedMapping({ columnMapping, categoryMapping });
    setData(payload);
    setStage("ready");
    setPending(null);
    setColumnMapping(null);
    setPendingAccountNames([]);
    setCategoryMapping({});
  }, [pending, columnMapping, categoryMapping]);

  const backToColumnMapping = useCallback(() => {
    setStage("mapping-columns");
  }, []);

  const cancelMapping = useCallback(() => {
    setPending(null);
    setColumnMapping(null);
    setPendingAccountNames([]);
    setCategoryMapping({});
    setStage(data.transactions.length > 0 ? "ready" : "empty");
  }, [data.transactions.length]);

  const clearData = useCallback(() => {
    clearStoredData();
    setData(EMPTY);
    setStage("empty");
  }, []);

  const resetMapping = useCallback(() => {
    clearSavedMapping();
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      stage,
      transactions: data.transactions,
      fileName: data.fileName,
      updatedAt: data.updatedAt,
      sheetName: data.sheetName,
      usedFallbackSheet: data.usedFallbackSheet,
      error,
      uploadFile,
      pendingRows: pending?.rows ?? null,
      pendingFileName: pending?.fileName ?? null,
      pendingSheetName: pending?.sheetName ?? null,
      columnMapping,
      setColumnMapping,
      confirmColumnMapping,
      pendingAccountNames,
      categoryMapping,
      setCategoryMapping,
      confirmCategoryMapping,
      backToColumnMapping,
      cancelMapping,
      clearData,
      resetMapping,
    }),
    [
      stage,
      data,
      error,
      uploadFile,
      pending,
      columnMapping,
      confirmColumnMapping,
      pendingAccountNames,
      categoryMapping,
      confirmCategoryMapping,
      backToColumnMapping,
      cancelMapping,
      clearData,
      resetMapping,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
