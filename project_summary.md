# MudraPOS Project Structure Summary

This document provides a detailed overview of the files and directories in the MudraPOS project.

## Root Directory (`/`)

The root directory contains configuration files for the project's tooling, dependencies, and environment variables.

- **`.env.local`**: Local environment variables (typically used for Supabase URLs and keys).
- **`.gitignore`**: Specifies files and directories ignored by Git.
- **`package.json` & `package-lock.json`**: Defines npm dependencies, scripts, and project metadata. The project uses Next.js 15+, React 19, Supabase JS, Zustand (state management), Recharts, and Tailwind CSS v4.
- **`next.config.ts`**: Configuration file for Next.js.
- **`tsconfig.json`**: TypeScript compiler configuration.
- **`eslint.config.mjs`**: ESLint configuration for code linting.
- **`postcss.config.mjs`**: PostCSS configuration for Tailwind CSS.
- **`AGENTS.md` & `CLAUDE.md`**: Agent/AI-specific context or rules for the project.
- **`README.md`**: Project documentation.

## Source Directory (`/src`)

The `/src` folder holds all the application source code. It follows a modular structure organized by feature and architectural concerns.

### `/src/app` (Next.js App Router)
Contains the routing logic and main pages for the application.
- **`layout.tsx`**: The root layout wrapping all pages.
- **`page.tsx`**: The main landing or dashboard page.
- **`globals.css`**: Global stylesheet including Tailwind directives.
- **`favicon.ico`**: The application favicon.
- Feature-specific pages:
  - **`/customers/page.tsx`**: Customers management page.
  - **`/inventory/page.tsx`**: Inventory management page.
  - **`/pos/page.tsx`**: Point of Sale interface.
  - **`/reports/page.tsx`**: Sales and reporting dashboard.
  - **`/settings/page.tsx`**: Application settings.

### `/src/components`
Contains reusable React components organized by domain.
- **`providers.tsx`**: Global context providers (e.g., React Query, Theme).
- **`/customers`**: Components for the customer feature (`customer-form-drawer.tsx`, `customer-ledger.tsx`, `customer-list.tsx`, `payment-form-drawer.tsx`).
- **`/inventory`**: Components for inventory management (`product-form-drawer.tsx`, `product-table.tsx`).
- **`/layout`**: Structural components (`app-shell.tsx`, `sidebar.tsx`).
- **`/pos`**: Components for the Point of Sale screen (`cart-panel.tsx`, `customer-selector.tsx`, `metre-input-modal.tsx`, `payment-bar.tsx`, `product-selector.tsx`).
- **`/reports`**: Dashboard widgets and charts (`sales-chart.tsx`, `summary-cards.tsx`, `top-products-table.tsx`).
- **`/settings`**: Settings configuration forms (`gst-config-card.tsx`, `integrations-card.tsx`, `shop-details-card.tsx`, `staff-card.tsx`).
- **`/ui`**: Generic, reusable UI elements (`drawer.tsx`).

### `/src/lib`
Contains utility functions and external service integrations.
- **`utils.ts`**: Helper functions (e.g., Tailwind class merging).
- **`mock-data.ts`**: Mock data used for testing or development.
- **`/supabase`**: Contains Supabase client initializers.
  - **`client.ts`**: Supabase client for browser usage.
  - **`server.ts`**: Supabase client for server-side usage.

### `/src/stores`
Contains Zustand state management stores.
- **`cart-store.ts`**: Manages the POS cart state (items, quantities, totals).
- **`ui-store.ts`**: Manages UI state like sidebar toggle, modal visibility, etc.

### `/src/types`
Contains TypeScript type definitions.
- **`database.ts`**: Types reflecting the database schema (usually generated from Supabase).

## Public Directory (`/public`)
Contains static assets served directly by the web server.
- Icons and SVG graphics: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.

## Supabase Directory (`/supabase`)
Contains Supabase local development configuration and database definitions.
- **`config.toml`**: Local Supabase CLI configuration.
- **`schema.sql`**: The database schema definition containing table structures, row-level security policies, and functions.
- **`.temp/`**: Temporary files used by the Supabase CLI (project references, versions, etc.).
