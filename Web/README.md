# LenDen website

A responsive Next.js introduction to LenDen, with custom typography, a paper-and-ink visual style, an interactive sample ledger, project information, FAQs, and links to the repository and Shubham Kumar Dubey's GitHub profile.

## Run locally

Requires Node.js 20.9 or newer.

```bash
cd Web
npm install
npm run dev
```

Open http://localhost:3000.

## Validate and build

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Notes

- The preview uses fictional borrowers and in-memory sample transactions. Select a borrower, record repayments, or reset the demo. It does not connect to the API or persist data.
- Fonts are bundled locally through Fontsource; no external font requests or API keys are needed.
- This is a project website. The full ledger lives in the Expo mobile app.
- Deploy with `Web` as the project root on a Next.js-compatible host.
- Project links and copy are in `app/page.tsx`; metadata is in `app/layout.tsx`; styles are in `app/globals.css`.
