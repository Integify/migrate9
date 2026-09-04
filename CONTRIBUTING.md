# Contributing to Migrate9

Thanks for jumping in. This note is for anyone helping out, in-house or outsourced, so we’re not guessing at each other’s habits.

Migrate9 is a small, privacy-first tool. Keep changes focused. Prefer fixing the thing you came to fix over rewriting the whole app.

---

## Before you start

1. Read the [README](./README.md) so the product intent is clear.
2. If you’re fixing a bug or adding a feature, check open issues first (or ask your contact on our side) so we don’t double up.
3. For anything that touches numbering rules, privacy, or how files are handled: talk it through first. Those aren’t “drive-by” changes.

---

## Setup

```bash
git clone <this-repo>
cd migrate9
npm install
npm run dev
```

Run the tests when you touch conversion logic:

```bash
npm test
```

Before you open a PR:

```bash
npm run build
npm test
```

Both should pass on your machine.

---

## Branching

- Branch off `main` (or whatever default branch your invite points at).
- Name branches so a stranger can tell what they’re for:
  - `fix/unknown-operator-select`
  - `feat/filter-by-operator`
  - `docs/readme-setup`
- Keep one concern per branch. Mixed “UI polish + rewrite numbering” PRs are hard to review and easy to reject.

---

## What we care about in a change

**Correctness first.** Wrong numbers are worse than a missing button.

**Keep contacts local.** Don’t send `.vcf` data, contact names, or phone numbers anywhere off-device.

**Match the existing style.** This isn’t a greenfield design system. Reuse patterns in `main.tsx` / `styles.css` instead of inventing a new layout language.

**Tests for conversion logic.** If you change `src/lib/numbering.ts` or `src/lib/vcard.ts`, update or add Vitest cases. Real-world `.vcf` snippets in tests are gold; different phones export weirdly.

**Small PRs.** A reviewable PR is better than a heroic one. If the work is big, split it or open a draft early so we can steer.

---

## Pull requests

Please include:

- **What** changed, in plain language.
- **Why** it matters (bug report, ticket, user pain, whatever the source is).
- **How you checked it** (manual steps, `npm test`, browser/device if UI).
- Screenshots or a short screen recording for UI changes.
- Notes on anything you deliberately left out or weren’t sure about.

A good title looks like:

- `Fix duplicate 9-digit TEL when contact already has both`
- `Add empty state when filter has no matches`

Avoid titles like `update` or `fixes`.

We’ll review for behavior, privacy, and maintainability. Expect questions; that’s normal, not a brush-off.

---

## Commit messages

Write them for humans who weren’t in your head that day:

```
Explain the why in the subject when you can.

Optional body: what broke, what you tried, what to watch for.
```

Examples that work well:

- `Keep original TEL lines and append 9-digit copies`
- `Treat Gamcel 9… locals as pending instead of unknown`
- `Align footer GitHub link to the left`

---

## Code pointers

| Area | Where to look |
|------|----------------|
| Operator / digit rules | `src/lib/numbering.ts` |
| vCard parse & rewrite | `src/lib/vcard.ts` |
| Review UI, filters, download | `src/main.tsx` |
| Install / PWA helpers | `src/lib/pwa.ts`, `public/sw.js`, `public/manifest.webmanifest` |
| Visuals | `src/styles.css` |

When in doubt, follow the nearest existing code rather than introducing a new abstraction “for later.”

---

## What not to do (please)

- Don’t commit `node_modules/`, `dist/`, `.env`, or OS junk (`.DS_Store`).
- Don’t add tracking, ads, or third-party scripts that see contact data.
- Don’t force-push shared branches or rewrite history on `main`.
- Don’t expand scope mid-PR without a heads-up (“while I was here I also…”). Open a follow-up instead.
- Don’t paste real people’s contact exports into issues or PRs. Scrub or invent sample data.

---

## Communication

If you’re stuck for more than a short stretch, say so. A half-finished draft PR with a clear “blocked on X” note beats going quiet for a week.

Tag your Integify contact for:

- Numbering / regulator updates
- Branding or copy that should match other Integify products
- Anything that might need legal / privacy sign-off

---

## Code of conduct (short version)

Be respectful. Assume good intent. Critique the work, not the person. We’d rather ship a calm, careful tool than win an argument in a comment thread.

Welcome aboard, and thank you for helping people keep their address books usable through the transition.
