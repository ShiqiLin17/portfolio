# Shiqi Lin — Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript, with no build step.

## Files

- `index.html` – all page content (edit text here)
- `styles.css` – colors, fonts and layout (palette variables are at the top)
- `script.js` – interactions: mailbox letter, keep-scrolling note, lights switch, "Shiqi Times" front page, project pinboard and pop-ups, cursor-following scroll note, timeline, skills filter, copy email
- `garment.js` – the full-screen shirt story: a needle threads the top button, the screen frays open to show the heart, brain, eyes and muscle sewn inside, then stitches itself shut
- `needle.js` – the needle-and-yarn cursor (mouse only; off with reduced motion)
- `cad.js` – the CAD lab 3D viewer (three.js)
- `vendor/` – bundled three.js, so the site has no outside script dependencies
- `favicon.svg` – browser tab icon

Project pop-up text lives in the `projects` object in `script.js`, and experience pop-ups in the `experience` object.

### Adding photos, videos and links

Put files in `media/`, then add to any project or experience entry in `script.js`:

```js
media: [
  { type: "image", src: "media/robot.jpg", alt: "Robot on the field", caption: "2023 season" },
  { type: "video", src: "media/demo.mp4" },
  { type: "youtube", id: "VIDEO_ID" },
],
links: [{ label: "Visit the site", href: "https://example.com" }],
```

Entries without media show "coming soon" placeholders.

### Photos of me

Put pictures in `media/me/` and list them in `ME_PHOTOS` at the bottom of `script.js`. The first one goes in the About polaroid, and the second (or first) is hidden in the shirt pocket for visitors to drag out.

### CAD models

Export from Fusion 360 as `.stl` into `cad/`. File names and descriptions are listed at the top of `cad.js`.

## Preview locally

The CAD viewer needs a local server (opening the file directly won't load it). Run:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy on Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `ShiqiLin17/portfolio` repo.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
4. Save and deploy. Every push to `main` redeploys automatically.
