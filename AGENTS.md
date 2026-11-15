# AGENTS.md — Careerly

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (Radix) · Lucide React
Project root: D:\careerly

## Run
npm install --no-audit --no-fund --legacy-peer-deps
npm run dev

npm registry is set globally to an Iranian mirror (mirror-npm.runflare.com).
If installs fail, try https://mirror.kargadan.ir/repository/npm-group/ or a VPN proxy.

## HARD RULES — violating these breaks the app

1. NEVER run `npx shadcn init`. It overwrites app/globals.css and destroys the palette.
2. NEVER regenerate these files with `shadcn add`. They were manually converted to
   Radix because the whole app uses the `asChild` API. The current shadcn CLI ships
   Base UI versions that do NOT support `asChild`:
   - components/ui/button.tsx
   - components/ui/dialog.tsx
   - components/ui/sheet.tsx
   - components/ui/dropdown-menu.tsx
   - components/ui/tooltip.tsx
3. NEVER use `next/font/google`. Google Fonts is blocked here and causes 30s+ compile
   hangs. Fonts are declared as local/system stacks in app/globals.css :root.
4. Do NOT create app/page.tsx. The dashboard lives at app/(app)/page.tsx.
   Two files resolving to "/" cause a Next.js build error.
5. All colors live in app/globals.css :root. Do not hardcode colors in pages.
   Palette: #f1efe9 bg · #ffffff card · #5d6f61 primary · #eaf0ea secondary
            #e6b5a1 peach · #eabcaa peach-soft · #a1aba0 sage · #c3cfc4 sage-soft
            #bfcac0 sage-line · #f6e3da accent · #c05b49 destructive
6. Serif headings use the local serif stack (Times New Roman first). Body uses sans.
   Do not change this without being asked.

## Architecture
- app/(app)/layout.tsx → components/app-shell.tsx (sidebar + topbar + mobile bottom nav + Cmd-K)
- lib/store.tsx → React context, all app state, persisted to localStorage
- lib/catalog.ts → templates, statuses, questions, coaches, FAQ, chapters
- components/shared.tsx → PageHeader, GradientPanel, ScoreRing, ResponsiveModal, Field, DangerConfirm
- components/doc-card.tsx → document card + all row actions
- components/magicui.tsx → MagicCard, NumberTicker, BorderBeam, AnimatedGradientText

## Responsive contract
- Desktop: fixed sidebar, centered dialogs, 2-column editor with live preview
- Mobile: bottom nav (5 items), Drawer instead of Dialog, editor Form/Preview toggle
  plus a sticky Fix/Tailor/AI bar. Never hide dates on mobile — wrap to a second line.
- ResponsiveModal already handles Dialog↔Drawer. Use it for every new modal.

## UX rules (from the pattern library)
- One name per status everywhere (card, modal, timeline, summary).
- Every destructive or status change needs a confirmation dialog.
- Empty state ≠ loading state. Empty = title + one sentence + one button. Loading = skeleton.
- No hidden paywalls: any limitation must be written on the button itself.
- Every number needs a denominator and a time range ("3 downloads in last 30 days").
- Disabled buttons must state the reason next to them.
- Never use placeholder text as a field label. Required fields show a red marker.

## Mocked (front-end only, ready to wire to real APIs)
AI generation, payments, PDF/DOCX export, LinkedIn import, email sending.
Real: TXT export, CSV export, localStorage persistence, all navigation and CRUD.

## Git
Remote: github.com/fariqiviana-bot (repo: farnavi)
Never commit node_modules/, .next/, globals.backup.css, .env*.local