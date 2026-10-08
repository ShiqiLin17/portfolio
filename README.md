# Shiqi Lin — Portfolio

Personal portfolio site. Plain HTML, CSS and a few lines of JavaScript, with no build step.

## Files

- `index.html` – all page content (edit text here)
- `styles.css` – colors, fonts and layout (palette variables are at the top)
- `script.js` – interactions: lights switch, live Boston readout, project carousel and pop-ups, timeline, skills filter, copy email
- `board.js` – the 3D circuit board that turns as you scroll (three.js)
- `vendor/` – bundled three.js, so the site has no outside script dependencies
- `favicon.svg` – browser tab icon

Project pop-up text lives in the `projects` object in `script.js`.

## Preview locally

The 3D board needs a local server (opening the file directly won't load it). Run:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy on Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `ShiqiLin17/portfolio` repo.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
4. Save and deploy. Every push to `main` redeploys automatically.
