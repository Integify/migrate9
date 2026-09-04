# Migrate9

Gambia’s mobile numbers are moving from 7 digits to 9. Migrate9 helps you update a contacts export so both the old and new numbers sit side by side, without uploading anyone’s address book to a server.

Drop in a `.vcf` file, review what changed, assign an operator when we’re not sure, then download a new file you can import back into your phone.

**Everything runs in your browser.** Contacts never leave the device.

Built by [Integify](https://www.integify.io).

---

## What it does

1. You export contacts as a vCard (`.vcf`) from your phone or computer.
2. You open that file in Migrate9.
3. We look for Gambian numbers (`+220`, `00220`, or plain `220…`) that are still 7 digits locally.
4. For Africell, QCell, and Comium we insert the right 2-digit prefix so the number becomes 9 digits.
5. Gamcel numbers starting with `9` are flagged as pending (their scheme isn’t locked in yet).
6. Ambiguous numbers get an “unknown” status; you pick the operator in the UI.
7. You download a new `.vcf` that keeps the original TEL lines and adds the updated ones.

The app is also installable as a PWA (Add to Home Screen / Install), so it can feel more like a small local tool than a website.

---

## Operator prefixes

| Operator | Prefix | Typical local starts |
|----------|--------|----------------------|
| Africell | `87`   | `40`, `41`, `2`, `7` |
| QCell    | `83`   | `50`-`53`, `58`, `59`, `3` |
| Comium   | `86`   | `6`, `8` |
| Gamcel   | n/a    | `9…` (shown as pending for now) |

The rules live in `src/lib/numbering.ts`. If regulators or operators publish updates, that’s the file to change, and the tests to update with it.

---

## Stack

- React 18 + TypeScript
- Vite 6
- Vitest for unit tests
- Service worker + web manifest for offline / install

No backend. No analytics SDK. No auth.

---

## Quick start

You’ll need Node.js 18+ (20 LTS is a safe bet).

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Useful scripts:

```bash
npm run build   # typecheck + production build → dist/
npm test        # run unit tests once
```

---

## Project layout

```
src/
  main.tsx           # UI: import, review table, filters, download, PWA install
  styles.css         # layout and theme
  lib/
    numbering.ts     # detect operator + build 9-digit form
    numbering.test.ts
    vcard.ts         # parse/rewrite .vcf, build review list
    vcard.test.ts
    pwa.ts           # install prompt helpers + SW registration
public/
  sw.js
  manifest.webmanifest
  icons/
```

If you’re changing conversion behavior, start in `numbering.ts` / `vcard.ts` and keep the tests green. UI-only work mostly stays in `main.tsx` and `styles.css`.

---

## Privacy note

Migrate9 is designed so contact data stays on the machine that opened the file. Please don’t add features that send `.vcf` contents (or derived contact data) to a remote API unless that’s an explicit, discussed product decision with a clear opt-in.

---

## Contributing

We’re bringing in outside help on this repo. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how we like PRs, branches, and reviews to work.

Issues and pull requests are welcome, especially around numbering edge cases, vCard quirks from different phone exports, and accessibility.

---

## License

Private / all rights reserved unless a license file is added later. If you’re an external contributor, assume you need an explicit agreement before reusing the code elsewhere.
