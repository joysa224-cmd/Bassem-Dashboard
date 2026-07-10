import { norm } from "./dataProcessor";
import type { AccountCategoryOrNone, CategoryMapping, ColumnMapping } from "./types";

const FIELD_KEYWORDS: Record<keyof Omit<ColumnMapping, "skipRows">, string[]> = {
  entryNo: ["قيد", "entry", "voucher", "رقم القيد"],
  date: ["تاريخ", "date"],
  debit: ["مدين", "debit"],
  credit: ["دائن", "credit"],
  mainAccount: ["الحساب الرئيس", "رئيسى", "رئيسي", "main account", "main"],
  subAccount: ["الحساب الفرع", "فرعى", "فرعي", "sub account", "sub"],
  description: ["شرح", "بيان", "وصف", "description", "narration"],
  costCenter: ["مركز تكلفة", "مركز التكلفة", "cost center", "cost centre"],
};

/** Best-effort column guesses from header text; falls back to sequential positions. */
export function guessColumnMapping(headers: string[], skipRows: number): ColumnMapping {
  const used = new Set<number>();

  function findByKeyword(field: keyof typeof FIELD_KEYWORDS): number {
    const keywords = FIELD_KEYWORDS[field];
    for (let i = 0; i < headers.length; i++) {
      if (used.has(i)) continue;
      const label = headers[i].toLowerCase();
      if (keywords.some((k) => label.includes(k.toLowerCase()))) {
        used.add(i);
        return i;
      }
    }
    return -1;
  }

  const mapping: ColumnMapping = {
    skipRows,
    entryNo: findByKeyword("entryNo"),
    date: findByKeyword("date"),
    debit: findByKeyword("debit"),
    credit: findByKeyword("credit"),
    mainAccount: findByKeyword("mainAccount"),
    subAccount: findByKeyword("subAccount"),
    description: findByKeyword("description"),
    costCenter: findByKeyword("costCenter"),
  };

  // Fall back to the original Modern Travel column order for anything still
  // unmapped, so a fresh upload of that exact format needs zero clicks.
  const fallbackOrder: (keyof typeof FIELD_KEYWORDS)[] = [
    "entryNo",
    "date",
    "debit",
    "credit",
    "mainAccount",
    "subAccount",
    "description",
  ];
  fallbackOrder.forEach((field, i) => {
    if (mapping[field] === -1 && i < headers.length && !used.has(i)) {
      mapping[field] = i;
      used.add(i);
    }
  });

  return mapping;
}

const KNOWN_CATEGORY_NAMES: Record<AccountCategoryOrNone, string[]> = {
  revenue: ["إيراد.نشاط", "ايراد.نشاط.متنوع", "إيراد", "ايراد", "revenue", "income", "sales"],
  opex: ["م.التشغيل", "مصروفات تشغيل", "مصروف تشغيل", "operating expense", "opex"],
  admin: ["م.عمومية.وادارية", "مصروفات إدارية", "إدارية وعمومية", "admin", "g&a"],
  cashBank: ["بنك", "الصندوق", "نقدية", "cash", "bank"],
  receivables: ["عملاء", "مدينون", "receivable", "customer", "accounts receivable"],
  payables: ["موردين", "دائنون", "payable", "supplier", "vendor", "accounts payable"],
  unclassified: [],
};

/** Best-effort category guess for a single account name, matching known Arabic/English conventions. */
export function guessAccountCategory(accountName: string): AccountCategoryOrNone {
  const normalized = norm(accountName).toLowerCase();
  for (const [category, names] of Object.entries(KNOWN_CATEGORY_NAMES) as [
    AccountCategoryOrNone,
    string[],
  ][]) {
    if (names.some((n) => normalized === norm(n).toLowerCase() || normalized.includes(norm(n).toLowerCase()))) {
      return category;
    }
  }
  return "unclassified";
}

export function guessCategoryMapping(accountNames: string[]): CategoryMapping {
  const mapping: CategoryMapping = {};
  for (const name of accountNames) {
    mapping[name] = guessAccountCategory(name);
  }
  return mapping;
}
