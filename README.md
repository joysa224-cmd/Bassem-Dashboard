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
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env.local`, then upload an Excel
workbook containing a sheet named `trans` (or any sheet — see below) from the
sidebar.

## Excel format

The uploaded workbook is parsed entirely in the browser (SheetJS/`xlsx`) — no
file is ever sent to a server. If a sheet named `trans` exists it's used;
otherwise the workbook's first sheet is used automatically, and the sidebar
shows which sheet was detected. The first 4 rows of that sheet are skipped;
row 5 holds the headers, and data starts at row 6, in this column order:

`رقم القيد | تاريخ | مدين | دائن | الحساب الرئيسى | الحساب الفرعى | شرح القيد | الصنف | كمية | السعر | مركز تكلفة`

Rows with `رقم القيد = 0` are treated as opening balances. Bank/cash movements
are matched to their counterparty account via matching `رقم القيد` (journal
entry number) to classify cash flow direct-method line items.

Parsed data is cached in the browser's `localStorage` so it persists across
reloads on the same device/browser — it is not shared between devices or
uploaded anywhere.

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
