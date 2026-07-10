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
workbook containing a sheet named `trans` from the sidebar.

## Excel format

The uploaded workbook must contain a sheet named `trans`. The first 4 rows are
skipped; row 5 holds the headers, and data starts at row 6, in this column
order:

`رقم القيد | تاريخ | مدين | دائن | الحساب الرئيسى | الحساب الفرعى | شرح القيد | الصنف | كمية | السعر | مركز تكلفة`

Rows with `رقم القيد = 0` are treated as opening balances. Bank/cash movements
are matched to their counterparty account via matching `رقم القيد` (journal
entry number) to classify cash flow direct-method line items.

## Environment variables

See `.env.example`:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — single-user login credentials
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — NextAuth JWT session config
- `BLOB_READ_WRITE_TOKEN` — optional; when set, uploaded Excel files are
  stored in Vercel Blob. When unset (e.g. local dev), files are stored on
  local disk under `.data/`.

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Set the environment variables above in the Vercel project settings
   (enable Vercel Blob and copy its `BLOB_READ_WRITE_TOKEN` for persistent
   file storage across serverless invocations).
3. Deploy — `vercel.json` is already configured for the Next.js framework.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the project
