# AGENTS.md — Farnavi

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (Radix) · Lucide
Brand: **Farnavi** · Market: global · Language: English + translatable
Model: subscription (Free / $19 mo / $39 per 3mo / $69 yr · launch $49 first 1000)

## 🔒 HARD RULE 0 — TEMPLATE COLORS ARE IMMUTABLE
The 25 template series are finished brand assets. Their colors must NEVER change.
- NO color picker, NO accent swatches, NO "Template & Colors" tab, NO recolor API.
- Two separate color namespaces that must NEVER mix:
  1. UI chrome  -> app/globals.css :root  (#f1efe9 #5d6f61 #e6b5a1 #eaf0ea ...)
  2. Template design -> public/templates/{id}/meta.json  (real extracted colors)
- The resume renderer reads ONLY namespace 2. If a color is missing it must FAIL,
  never fall back to the UI palette.
- `updateDoc` strips accent/font writes. Do not remove that guard.
- Same applies to template fonts unless the owner says otherwise.

## Other hard rules
1. NEVER run `npx shadcn init` — it overwrites globals.css and destroys the palette.
2. NEVER regenerate these with `shadcn add` (manually converted to Radix for asChild):
   button, dialog, sheet, dropdown-menu, tooltip, drawer, select, tabs, accordion,
   checkbox, radio-group, switch, slider, progress, avatar, scroll-area, command, sonner.
3. NEVER use `next/font/google` — blocked, causes 30s+ compile hangs.
4. Do NOT create app/page.tsx — dashboard lives at app/(app)/page.tsx.
5. UI palette/fonts stay as-is in globals.css.
6. No human services (no coaching, no proofreading marketplace).

## Assets
public/templates/{series}/ — 25 series, DOCX+PDF, A4+Letter, resume 1/2/3p,
cover letter, references. References is a differentiator none of the 3 competitors have.
ATS-safe today: series 11, 12, 14 (no text boxes). Others use 22-26 text boxes.

## AI
DeepSeek `deepseek-flash` (V4.1-Flash) via https://api.deepseek.com, OpenAI-compatible.
Off-peak = half price. JSON output for structured data. Keep system prompt stable for cache hits.

## UX rules
One name per status everywhere · confirm destructive/status changes ·
empty state ≠ loading · no hidden paywalls (limit written on the button) ·
every number needs a denominator + time range · disabled buttons state the reason ·
placeholder is never a label.

---

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