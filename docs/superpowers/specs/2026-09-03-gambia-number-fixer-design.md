# Gambia Number Fixer design

## Purpose

Build a free, one-page static web app that updates Gambian legacy seven-digit telephone numbers in a user-provided `.vcf` file to the announced nine-digit formats. All input, conversion, review, and download occur in the browser.

## Scope

The app accepts one `.vcf` file, immediately inspects its `TEL` properties, presents results and a review table, allows operator selection only for unknown seven-digit Gambian numbers, and downloads a corrected file named `<original>-9digit.vcf`.

It does not include accounts, storage, tracking, a backend, other import formats, device-contact editing, calls/SMS, sharing, i18n, or additional pages.

## Stack and deployment

Use React, TypeScript, and Vite. Vite emits a fully static production bundle suitable for Vercel or any plain static file server. The build has no API routes, server runtime, external fonts, CDN assets, telemetry, cookies, or contact-data persistence. No requests are made after the application bundle and its local assets have loaded.

TanStack Start and TanStack Router are deliberately excluded: this is one view with no server work or route transitions, so they add code without a present caller.

## Components

- `App`: owns selected-file and conversion state and renders the one-page flow.
- `FileInput`: accessible drop zone and file picker, validating the `.vcf` extension and showing local parsing errors.
- `Summary`: reports converted counts by operator, pending Gamcel, unknown, and untouched values.
- `ReviewTable`: shows each changed or flagged number with before/after/operator. Unknown rows expose a manual operator choice; Gamcel does not.
- `DownloadButton`: serializes the current in-memory review choices and downloads the VCF.

Components remain mobile-first and fit a 360px viewport without horizontal scrolling.

## Number mapping

`src/lib/numbering.ts` is the sole editable source of operator assignments. Detection considers exactly seven local digits after removing a Gambian country prefix and display separators for detection only. The longest leading prefix determines the result:

- Africell (`2`, `7`, `40`, `41`) prepends `87`.
- QCell (`3`, `50`, `51`, `52`, `53`, `58`, `59`) prepends `83`.
- Comium (`6`, `8`) prepends `86`.
- Gamcel (`9`) is pending and unchanged.
- All other seven-digit candidates are unknown and unchanged until manually assigned.

Existing nine-digit numbers are unchanged. Values carrying a non-Gambian country code are unchanged. A Gambian calling prefix may be written as `+220`, `00220`, or `220`; spaces, dashes, parentheses, and dots are accepted for detection. On conversion, only the two new digits are inserted at the start of the local number segment so the existing formatting and country-code form are retained.

## VCF transformation

The transformer works line-by-line on raw text, preserving original line endings and every line other than newly inserted companion `TEL` lines byte-for-byte. It recognizes folded vCard property lines, `TEL` properties with parameters, vCard 2.1/3.0/4.0 forms, and multiple numbers per contact. It retains `PHOTO`, `NOTE`, custom properties, non-ASCII text, and unknown values unchanged. For each convertible (or manually assigned) legacy `TEL`, it keeps the original line and inserts a companion `TEL` immediately after it with the same property name and parameters and the nine-digit value. If that companion value already exists on the contact, no second line is added.

Review items keep a stable reference to the legacy TEL occurrence. When an operator is manually selected, the download is regenerated from the source text using that assignment. A transformed output rerun through the mapper produces an identical file.

## Error handling and privacy

The app rejects missing or non-VCF selections with a concise local message. Malformed or unsupported TEL values are counted as untouched and preserved. All files remain in browser memory only, and the page states this plainly. It also notes that dual running of seven- and nine-digit dialing ends on November 30, 2026.

## Verification

Write unit tests before implementation for the mapper: every announced operator prefix; `40`/`41` versus other `4x`; `53` versus `54`; `59` versus other `5x`; Gamcel `9`; unknown `54`–`57`; nine-digit values; country-prefix and separator forms; non-Gambian values; and empty/malformed values.

Add a VCF round-trip fixture with multiple TEL fields on one contact, `PHOTO`, a non-ASCII name, vCard 2.1, and every operator case. Assert only intended TEL lines change, manual unknown assignments update the downloaded result, Gamcel stays unchanged, and a second pass is identical. Finally run the full test command and production static build.
