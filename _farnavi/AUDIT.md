# FARNAVI — CHUNK 01 AUDIT

Generated: 2026-11-17T08:27:44.545Z

## 1. Renderer coverage
- Registered renderers: 2
- Missing renderers: 3, 4, 11, 12, 14, 22, 24

## 2. Catalog identity
- template-catalog ids: 
- legacy catalog ids: editorial-11, prime-ats-11, harmonized-12, precision-ats-12, calligraphic-14, pure-ats-14, crest-22, momentum-ats-22, cover-editorial-11, cover-harmonized-12, cover-calligraphic-14, cover-crest-22, ex-product-designer, ex-marketing-manager, ex-software-engineer, ex-molecular-biologist
- ids used by store: editorial-11, prime-ats-11, harmonized-12, calligraphic-14, crest-22
- MISMATCHED ids (store -> not a real series): editorial-11, prime-ats-11, harmonized-12, calligraphic-14, crest-22

## 3. Build blockers
- lib/template-series.ts truncated: false
- tail: `1) =>
  seriesById(id)?.gdocs.find((g) => g.doc === doc && g.size === size && (doc !== "resume" || g.pages === pages));`

## 4. HARD RULE 0 violations (template colors/fonts editable)
- app/(app)/editor/[id]/page.tsx:193  `accent: doc.accent,`
- app/(app)/editor/[id]/page.tsx:369  `<button key={c} onClick={() => updateDoc(doc.id, { accent: c })} className={cn("h-8 w-8 rounded-full border-2", doc.accent === c ? "border-foreground" : "border`
- app/(app)/editor/[id]/page.tsx:374  `<Select value={doc.font} onValueChange={(v) => updateDoc(doc.id, { font: v })}>`
- app/(app)/editor/[id]/page.tsx:492  `<TabsList className="w-full rounded-full"><TabsTrigger value="template" className="flex-1 rounded-full">Template & Colors</TabsTrigger><TabsTrigger value="text"`
- app/(app)/editor/[id]/page.tsx:496  `<button key={t.id} onClick={() => { updateDoc(doc.id, { template: t.id, accent: t.accent }); setTwoCol(t.twoCol); }} className={cn("rounded-xl border p-2 text-l`
- app/(app)/editor/[id]/page.tsx:504  `<Field label="Font"><Select value={doc.font} onValueChange={(v) => updateDoc(doc.id, { font: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>`

## 5. Extracted locked design
| series | accent | source | heading | body | color confidence | review |
|---|---|---|---|---|---|---|
| 2 | #1F3C88 | docx-text | Rubik | Rubik | high | 1 |
| 3 | #2F5496 | docx-text | Open Sans | Open Sans | high | 1 |
| 4 | #2F5496 | docx-text | Source Sans 3 | Merriweather | high | 1 |
| 11 | #2F5496 | docx-text | Merriweather | Merriweather | high | 1 |
| 12 | #2F5496 | docx-text | Work Sans | Work Sans | high | 1 |
| 14 | #2F5496 | docx-text | Inter | Inter | high | 2 |
| 22 | #2F5496 | docx-text | Source Sans 3 | Source Sans 3 | high | 1 |
| 24 | #2F5496 | docx-text | Roboto | Inter | high | 2 |

## 6. Assets
| series | meta | gdocs | design | previews | docx | pdf |
|---|---|---|---|---|---|---|
| 2 | true | true | true | 10 | 10 | 10 |
| 3 | true | true | true | 10 | 10 | 10 |
| 4 | true | true | true | 10 | 10 | 10 |
| 11 | true | true | true | 8 | 8 | 8 |
| 12 | true | true | true | 8 | 8 | 8 |
| 14 | true | true | true | 8 | 8 | 8 |
| 22 | true | true | true | 10 | 10 | 10 |
| 24 | true | true | true | 10 | 10 | 10 |

## 7. Fonts not installed via @fontsource
- Merriweather 24pt
- Inter 18pt
- Times New Roman
- Calibri

## 8. Open review items
- [2] layout ambiguous: docxCols=1 but 22 text boxes (meta.columns=1) — verify visually
- [3] layout ambiguous: docxCols=1 but 24 text boxes (meta.columns=1) — verify visually
- [4] layout ambiguous: docxCols=1 but 26 text boxes (meta.columns=2) — verify visually
- [11] meta heading font 'Merriweather' not present in docx rFonts (Merriweather 24pt, Open Sans, Source Sans 3, Lato, Playfair Display)
- [12] muted color defaulted to #555555
- [14] muted color defaulted to #555555
- [14] meta heading font 'Inter' not present in docx rFonts (Inter 18pt, Poppins, Source Sans 3, Times New Roman, Open Sans)
- [22] layout ambiguous: docxCols=1 but 24 text boxes (meta.columns=1) — verify visually
- [24] muted color defaulted to #555555
- [24] layout ambiguous: docxCols=1 but 22 text boxes (meta.columns=2) — verify visually

## 9. Importers
- **template-series**: (none)
- **template-catalog**: app/(app)/templates/page.tsx, components/doc-card.tsx
- **lib/catalog**: app/(app)/ai/linkedin/page.tsx, app/(app)/checker/page.tsx, app/(app)/editor/[id]/page.tsx, app/(app)/help/page.tsx, app/(app)/interviews/page.tsx, app/(app)/tools/page.tsx, app/(app)/tracker/page.tsx, components/shared.tsx
- **template-assets**: (none)