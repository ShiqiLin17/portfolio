# Shiqi Lin — Portfolio

Personal portfolio site. Plain HTML, CSS and a few lines of JavaScript, with no build step.

## Files

- `index.html` – all page content (edit text here)
- `styles.css` – colors, fonts and layout (palette variables are at the top)
- `script.js` – sets the footer year
- `favicon.svg` – browser tab icon

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy on Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `ShiqiLin17/portfolio` repo.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
4. Save and deploy. Every push to `main` redeploys automatically.
