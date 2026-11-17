# FARNAVI — DECISIONS (updated after CHUNK 03)

1  UI typography ....... KEEP CURRENT. globals.css untouched.
2  Template color/font . Locked in Free; UNLOCKED as a PRO feature in C09b.
                         This is the primary paywall (Kickresume gates exactly this:
                         Design&Colors limited->unlimited, Fonts 2->26).
3  Legacy id map ....... CONFIRMED by user. Implemented in lib/editor/templates.ts + store v3.
4  Columns ............. 2,3,4,22,24 = two-column ; 11,12,14 = single-column.
                         design.json is authoritative; pixel gutter detection is evidence only.
5  Business model ...... SUBSCRIPTION (user decision). Payment gateway: YES.
                         Recommended: Monthly $12 / Quarterly $29 (HERO) / Yearly $79.
                         7-day full-Pro trial, NO card. Downgrade to Free, never lock editing.
                         Student program (ISIC/UNiDAYS) free. One-time add-on: human proofreading.
                         Rationale: job search is episodic (BLS median 11.5 weeks, mean 24.8;
                         45% search 3+ months; Kickresume FAQ says 3-6 months).
                         PENDING: Merchant of Record (Paddle/LemonSqueezy) vs own Stripe entity.
6  Gating .............. Free: unlimited docs + unlimited PDF/TXT, 3 ATS templates,
                         locked design, overall score only.
                         Pro: all 8 templates, color+font freedom, photo, DOCX, AI quota,
                         5-category score, ATS view + JD targeting, version history, translate.
7  AI .................. offline -> BYOK -> server key (C11). No key in client bundle.
8  Persistence ......... adapter: localStorage (C04) -> IndexedDB (C06, photos) -> server (C13).
9  Language ............ English source, translatable; uiLocale != contentLocale (C04).
10 Photo ............... template-gated + user toggle/style, only 2/3/4/22/24.
11 Environment ......... D:\careerly · feat/editor-create-v2.

TRUTH HISTORY (honest)
C01 colors were Word theme defaults (#2F5496) — WRONG.
C02 had 7 bugs: falsy-zero black, saturation cutoff killed pale tints,
    monochrome templates mislabeled "none", degenerate roles, duplicate #8496B0,
    font size suffix not stripped, DOCX column detection failed.
C03 fixes all of the above AND changes the workflow: machine proposes with
    region evidence, human locks once via EyeDropper in swatches.html.