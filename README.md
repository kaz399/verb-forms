# verb-forms

A web app for junior high school students to learn the five forms of English verbs
(base, 3rd person singular, past, past participle, and -ing).
See [DESIGN_ja.md](DESIGN_ja.md) for the design goals (in Japanese).

## Development

Requires Node.js 24 or later.

```sh
npm install
npm run dev        # start the dev server at http://localhost:5173/verb-forms/
npm test           # run unit tests
npm run build      # type-check and build into dist/
npm run preview    # serve the production build (service worker enabled)
npm run docs:verbs # regenerate VERBS.md after changing src/data/verbs.ts
```

[VERBS.md](VERBS.md) lists every verb and every sentence the app can ask. A test fails when it is out of date.

The app icons in `public/` are generated from `public/icon.svg`:

```sh
npm run generate-pwa-assets
```

## Project layout

| Path | Contents |
|---|---|
| `src/data/` | Verb table |
| `scripts/` | Generator for VERBS.md |
| `src/logic/` | DOM-free logic: sentence templates, questions, answer diagnosis, review list |
| `src/ui/` | Rendering and event handling for each tab |
| `verb_forms.html` | Original single-file prototype, kept for reference |

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds, and publishes `dist/` to GitHub Pages.
The site is served under `/verb-forms/`; if the repository is renamed, update `BASE_PATH` in `vite.config.ts`.
In the repository settings, set **Pages → Source** to **GitHub Actions**.
