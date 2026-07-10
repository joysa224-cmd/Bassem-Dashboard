import type { DataPayload, SavedMapping } from "./types";

const DATA_KEY = "modern-travel:data";
const MAPPING_KEY = "modern-travel:mapping";

export function readStoredData(): DataPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DataPayload;
  } catch {
    return null;
  }
}

export function writeStoredData(payload: DataPayload): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATA_KEY, JSON.stringify(payload));
}

export function clearStoredData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DATA_KEY);
}

export function readSavedMapping(): SavedMapping | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MAPPING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedMapping;
  } catch {
    return null;
  }
}

export function writeSavedMapping(mapping: SavedMapping): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping));
}

export function clearSavedMapping(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MAPPING_KEY);
}
