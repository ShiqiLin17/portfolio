# Shiqi Lin — Portfolio

A scroll-driven 3D movie set in a New York mansion. Plain HTML, CSS and JavaScript with three.js bundled in `vendor/`. There is no build step.

## The eight scenes

1. **Foyer**: a drone hovers in a Forest Hills / Dyker Heights style mansion.
2. **Headlines**: the camera circles the drone, takes its point of view, flies out the window to a Central Park view of Billionaires' Row, and *The Shiqi York Times* slaps onto the screen.
3. **Letter**: back through the front door and up the stairs to the study, where a half-written letter sits on the desk (About me).
4. **Experience book**: a glowing book on the shelf opens into a flippable book, with one page per role and photo and video slots.
5. **Workshop**: the tool wall and the bench builds. Drag the parts, use Take apart / Build, click the sketch paper for the toolbox, or open the project files.
6. **Certificates & honors**: framed on the study wall. Click a frame for details and its verification link.
7. **Hobbies**: in the bedroom, Photos on the laptop holds clickable hobby videos.
8. **Contact**: the drone lasers a hologram with email, LinkedIn and GitHub.

## Files

- `index.html` – page structure, scene overlays and dialogs (the letter text lives here)
- `data.js` – **all content**: projects, experience, certificates and honors, skills, builds, hobbies, contacts and photos
- `world.js` – the 3D world: mansion, rooms, furniture, Manhattan, drone, Shiqi
- `app.js` – scroll camera, drone path, interactions and dialogs
- `styles.css` – overlays and dialogs
- `vendor/` – three.js and helpers

## Adding photos, videos and links

Put files in `media/`, then add them to the matching entry in `data.js`:

```js
media: [
  { type: "image", src: "media/robot.jpg", alt: "Robot on the field" },
  { type: "video", src: "media/demo.mp4" },
  { type: "youtube", id: "VIDEO_ID" },
],
links: [{ label: "Visit the site", href: "https://example.com" }],
```

- **Experience pages** use `experience` entries: images fill the polaroids, and videos play from "Watch the video".
- **Hobby videos** use `HOBBIES`.
- **Your photo** on the letter is the first item in `ME_PHOTOS`.
- **Certificate scans** go in the `media` of a `CERTS` item.

## Preview locally

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000. Add `?still` to the URL to turn off camera smoothing, which is handy for screenshots.

## Deploy on Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `ShiqiLin17/portfolio` repo.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
4. Save and deploy. Every push to `main` redeploys automatically.
