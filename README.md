# Maridew Holdings Ltd — Corporate Website

A dynamic single-page company website built from `Maridew_Holdings_Company_Profile.docx`.

## Structure

```
index.html        Page shell — all content sections
css/styles.css    Full stylesheet (responsive, light theme, dark sections)
js/data.js        All site content as structured data (divisions, pillars, clients, taglines…)
js/main.js        Dynamic rendering + interactions
tools/serve.pl    Dependency-free local preview server (Perl core modules only)
```

## Run locally

```bash
perl tools/serve.pl . 8137
# open http://127.0.0.1:8137/
```

Opening `index.html` directly in a browser also works (no build step, no dependencies).

## Dynamic features

- **Service catalogue** — all 16 divisions / 174 services rendered from `js/data.js`
- **Live search** with match highlighting across division titles, summaries and services
- **Phase filters** — Assess · Plan · Design · Deliver · Realise · Sustain
- **Accordion** divisions (one open at a time, animated height)
- **Animated hero counters**, scroll-reveal sections, sticky header
- **Tagline rotator** across all 10 positioning taglines
- **Contact form** with per-field validation, division selector and simulated async submit
- **Mobile drawer navigation**, fully responsive layout

## Deployed

Production (Cloudflare Pages, free plan): **https://maridew-holdings.pages.dev/**

- Project: `maridew-holdings` (account `20a105430ee083f92ba61a44d7629754`)
- Deployed via the Cloudflare API as a Pages `_worker.js` deployment (the site is
  served by a Worker that gunzips the four embedded files at the edge).
- Current production deployment id: `4ba1c9ef-17af-4d51-b9c3-16be7e27c573`
- Every shipped file is verified against its local SHA-256 before deployment.

To redeploy after editing files, regenerate the gzip+base64 payloads and repeat the
API deployment (ask the agent — it has the pipeline scripted).

## Editing content

Update `js/data.js` only — the page re-renders itself from that data. No HTML edits needed
for content changes.

## Notes

- Contact form submission is simulated client-side; point it at a real endpoint (or a
  service like Formspree) when one exists.
- Contact email/phone in `index.html` are placeholders — replace with real details.
