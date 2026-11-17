# FARNAVI - DECISIONS ADDED (chunk 03b)

BRANDING (free tier)
- YES, brand the free PDF. Only Enhancv does this among the 6 audited competitors;
  Kickresume watermarks the PREVIEW only; Resume.io/Zety/Rezi/Teal gate the download instead.
- Render as SVG OUTLINED PATHS -> no extractable text -> zero ATS pollution.
- Place inside the bottom margin: baseline 4mm from page edge, clearance 6mm.
  All 8 templates have 12.7mm bottom margin => ZERO content displacement, no extra page.
- Grayscale #9A9A9A, 6.5pt wordmark + 2.4mm logo. Third namespace: "platform overlay".
- TXT export is NEVER branded (clean ATS escape hatch, free forever).
- Share link page /s/{id} carries a "Built with Farnavi" banner on free.
- PDF metadata Producer = Farnavi on every plan.
- Lock UI must show the TRUE state with a named reason (never Enhancv's green-ON + red error).

TRIAL
- 7 days, full Pro, NO card. Started BY THE USER at the first Pro wall (just-in-time).
- On expiry: downgrade to free. Documents preserved. EDITING IS NEVER LOCKED.
- Amber banner at T-3 and T-1 + email.
- One trial per account (later: per device + per payment method via MoR).
- 14-day money-back guarantee on paid plans (Kickresume/Rezi trust pattern).
- Metrics from day one: trial_start_rate, trial_to_paid, first_wall_hit, time_to_first_export.
- Client-only trial is bypassable; server verification lands in C13. Accepted for soft launch.

PAYMENTS
- Launch entity: UAE. Paddle (MoR) supports AE sellers with USD settlement -> primary.
  Stripe UAE is possible with a UAE trade license + Emirates ID + UAE bank account -> secondary later.
- lib/billing/* is provider-agnostic. A provider only produces { plan, proUntil }.

COLORS
- #2F5496 / #44546A / #8496B0 are Word THEME defaults, not brand colors.
- #111111 was the falsy-zero bug; true ink is #000000.
- 6 of 8 templates are genuinely monochrome (accentKind = "ink" is a CORRECT answer).
  Only series 2 (navy #1F3C88/#002060) and series 12 (pale green #F1F8ED) carry chroma.
- Workflow: run fix-04 -> swatches.html v3 -> zoom 200-300% -> EyeDropper on the CENTER of a
  thick stroke or solid fill -> Copy overrides JSON -> design-overrides.json -> re-run fix-04.
- Leave a role null if the template has no such element. Do not invent colors.