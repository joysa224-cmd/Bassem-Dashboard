import type { DataPayload } from "./types";

const STORAGE_KEY = "modern-travel:data";

export function readStoredData(): DataPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DataPayload;
  } catch {
    return null;
  }
}

export function writeStoredData(payload: DataPayload): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
