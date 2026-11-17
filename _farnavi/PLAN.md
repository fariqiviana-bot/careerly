# FARNAVI — Create/Edit Resume :: Plan (updated after C02)

C01 done  audit + contracts
C02 done  design truth v2 (PNG+DOCX) | columns verified | build green | single resolver | lock patch | real previews
C03       store v3 migration (legacy->series map below) + i18n kernel (en) + storage adapter + drop legacy catalog
C04       PageCanvas: mm/pt, A4/Letter, pagination, overflow, zoom/fit, print CSS
C05       renderers 11 / 12 / 14 (single column) + IndexedDB adapter
C06       renderers 2 / 3 / 4 / 22 / 24 (two column + photo) + cover letter + references
C07       inline click-to-edit: caret, paste sanitize, bullets, drag handle, a11y
C08       3-pane shell + topbar + mobile sheets + shortcuts + undo/redo
C09       create flow + section forms + Design Inspector (all sliders persisted)
C09b      UNLOCK template color/font: overrides + derived tint/deep + contrast guard + reset
C10       5-category score + ATS text view + JD keyword targeting
C11       AI layer: offline -> BYOK -> server key
C12       export: real PDF / real DOCX / TXT / Google Docs / share / email
C13       server persistence + version history + a11y + perf + visual regression

LEGACY -> SERIES MAP (needs user confirmation)
editorial-11 -> 11 design      prime-ats-11 -> 11 ats
harmonized-12 -> 12 design     precision-ats-12 -> 12 ats
calligraphic-14 -> 14 design   pure-ats-14 -> 14 ats
crest-22 -> 22 design          momentum-ats-22 -> 22 ats
cover-* -> same series, kind=cover
"ATS" becomes a variant flag, not a separate template. Great Vibes removed (not installed).

NON-NEGOTIABLE
- renderers read design tokens; never hardcode template colors
- UI chrome palette (globals.css) and template palette never mix
- no npx shadcn init; no shadcn add over the 17 hand-converted Radix components
- no next/font/google; Google Fonts self-hosted via @fontsource
- never create app/page.tsx