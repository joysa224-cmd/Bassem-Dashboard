# Modern Travel — Financial Analytics Dashboard

A financial analytics web app for Modern Travel: Excel-driven income statement,
collections/payments (DSO/DPO), a direct-method cash flow statement, and expense
analysis. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and
Recharts. RTL Arabic UI.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env.local`, then upload any Excel
workbook from the sidebar and walk through the mapping wizard described below.

## Works with any Excel layout

The uploaded workbook is parsed entirely in the browser (SheetJS/`xlsx`) — no
file is ever sent to a server. If a sheet named `trans` exists it's used;
otherwise the workbook's first sheet is used automatically, and the sidebar
shows which sheet was detected.

Since ledgers don't all use the same columns or account names, the first
upload (or any file with an unrecognized layout) walks through a two-step
mapping wizard instead of assuming a fixed format:

1. **Column mapping** — choose how many header rows to skip (0–5), then pick
   which column holds the entry number, date, debit, credit, main account,
   sub account, description, and (optionally) cost center. A live preview of
   the first few data rows updates as you adjust the skip-rows count, so it's
   easy to confirm you've landed on the right header row.
2. **Category mapping** — every distinct account name found in the main
   account column is listed once; assign each to Revenue, Operating
   Expenses, Admin Expenses, Cash/Bank, Receivables, or Payables (or leave it
   unclassified). Both the column choices and category assignments come
   pre-filled with a best-effort guess (keyword matching for columns, known
   Arabic/English account-naming conventions for categories).

Both mappings are saved to `localStorage`. The next time a file with the same
column layout and the same account names is uploaded, the wizard is skipped
entirely and the dashboards populate immediately. A "reset mapping" link in
the sidebar clears the saved mapping if you want to redo it from scratch.

Rows whose entry number is `0` are treated as opening balances. Cash/Bank
movements are matched to their counterparty account via the entry number
(journal entry linking) to classify cash flow direct-method line items —
this replaces the old Bank-vs-Cash split with a single combined cash/bank
statement, since an arbitrary file has no guaranteed way to tell the two
apart.

Parsed data and both mappings are cached in the browser's `localStorage` so
they persist across reloads on the same device/browser — nothing is shared
between devices or uploaded anywhere.

## Environment variables

See `.env.example`:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — single-user login credentials
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — NextAuth JWT session config

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Set the environment variables above in the Vercel project settings.
3. Deploy — `vercel.json` is already configured for the Next.js framework.
   No storage service (Blob, database, etc.) is required since Excel parsing
   happens entirely client-side.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the project
