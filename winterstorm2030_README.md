# WinterStorm2030

**Governance Capacity Instrument — v7.0**
NATO STO SAS-219 · High North Scenarios for Wargaming and Analysis
E-IAIG-HT framework (Evans — Intent/Autonomy/Interaction/Governance-Hierarchical Theory)

A single-page, client-side wargaming and treaty-governance instrument for the Arctic High
North grey-zone scenario space. No backend — everything (including document scoring and
OCR) runs in the browser.

## Repository structure

```
winterstorm2030/
├── index.html      Page structure, login/landing screens, all tab markup
├── css/
│   └── styles.css   Full visual theme (dark chart-instrument palette)
├── js/
│   └── app.js       All application logic — session state, scoring engine,
│                     Decision Velocity, Governance Analytics, access control
└── README.md         This file
```

`index.html` loads three external libraries by CDN (`<script src>` tags in `<head>`),
used only for document ingestion in Governance Lab:

- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF text extraction
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) — DOCX text extraction
- [Tesseract.js](https://tesseract.projectnaptha.com/) — in-browser OCR fallback for
  scanned/image-only PDF pages

An internet connection is required for these three; the rest of the instrument (session
state, scoring math, all tabs) works fully offline once the page has loaded.

## Running it

No build step. Open `index.html` directly in a browser, or serve the folder with any
static file server (recommended, since some browsers restrict `file://` access to the
CDN scripts):

```bash
cd winterstorm2030
python3 -m http.server 8000
# then open http://localhost:8000
```

## Access codes

Two logins are recognized (`doLogin()` in `js/app.js`):

| Callsign field | Access code | Result |
|---|---|---|
| any value | `WinterStorm2030!` | Full instrument, all 12 tabs, DM/DS toggle available |
| any value | `DisruptiveCap-2030` | Restricted Disruptive Capabilities team view — 7 tabs only (Overview, NATO Cap Gap, Capability Cards, Governance Lab, Governance Analytics, Live Tracking, OSINT Feed), DM/DS toggle hidden |

Both are plain constants near the top of `js/app.js` (`TEAM_ACCESS_CODE`,
`TEAM_ALLOWED_TABS`) — edit directly to change the code or which tabs the restricted
view exposes.

## What's in each tab

00 Scenario Input · 01 Overview · 02 Actor Analysis · 03 Concession Engine ·
04 Cognitive Warfare (DS-only) · 05 NATO Cap Gap · 06 Narrative Analysis (DS-only) ·
07 Live Tracking · 08 Governance Lab (DS-only) · 09 Governance Analytics (DS-only) ·
10 Capability Cards (DS-only) · 11 OSINT Feed

Hover any tab in the running instrument for a one-line description of its purpose.

## Governance Lab — document scoring

Paste or drop a `.txt`, `.pdf`, or `.docx` file. Scanned/printed PDFs with no text layer
fall back to Tesseract OCR automatically. Every scored document computes a Coverage
Score (Article Matches × 6 + Violation Categories × 8 + Precedent Alignment × 5 + Treaty
Architecture × 5, capped at 100) against:

- The North Atlantic Treaty's 14 Articles (with hand-authored strength ratings and, for
  six Articles, a grounded Recommended Fix)
- The 7-category grey-zone violation taxonomy
- The 11-treaty Precedent Library
- The 5-provision Treaty Architecture for Critical Maritime Infrastructure

Results post into the Evidence Ledger on Governance Analytics automatically.

## Governance Analytics

- **NATO Treaty 1949 Shortcomings** — triggered by the "End Game" header button or the
  in-tab button; cross-references each Article's Recommended Fix against this session's
  own Article 4 Log, Gap Event Log, and scored documents, and exports to Markdown.
- **PSTOA** (Policy Stress-Test Outcome Assessment) — five dimensions computed from
  session state.
- **Treaty Performance Metrics** — modeled on Annex C of the Treaty Architecture.
- **Evidence Ledger** — Article 4 tags + Governance Lab scoring + Arbitration outcomes
  in one auditable table.
- **Decision Velocity** — average response time to Agentic AI moves and session tempo,
  computed from real timestamps in the session's action log.

## Version history (recent)

- **v7.0** — universal tooltip system (fixed-position, can't be clipped by scrolling
  containers); Scenario Name converted to a 10-preset Arctic High North dropdown with
  custom-entry fallback; hover explanations on every nav tab.
- **v6.0** — Disruptive Capabilities team access code and restricted tab view; Governance
  Lab Reset button and Scored Documents Log; removed stray Auracelle Charlie attribution
  from Governance Analytics.
- **v5.0** — End Game mechanic and the NATO Treaty 1949 Shortcomings synopsis; recommended
  fixes grounded in the Precedent Library for six Treaty Articles.
- **v4.0** — real Governance Lab scoring engine (replacing a logging-only stub); Decision
  Velocity; PDF/DOCX/OCR document ingestion.

## Notes for future edits

- All version-display strings (title tag, header, footer) are plain text — bump them
  together when releasing a new version; historical `// vX.0 — ...` comments in
  `js/app.js` mark when each feature was actually added and shouldn't be changed.
- The scoring engine, Precedent Library, Treaty Article data, and Capability Cards are
  independent structures in `js/app.js` — search for `TREATY_ARTICLES`,
  `PRECEDENT_LIBRARY`, `TREATY_ARCH_PROVISIONS`, `GOVLAB_VIOLATION_TYPES`.
