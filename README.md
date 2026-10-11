# Shiqi Lin — Portfolio

A scroll-driven storybook, like the opening of an animated fairy-tale film: a book on the table opens, the narrator begins "Once upon a time…", the camera steps into the painted page, and the story plays out inside it before the book closes again. Plain HTML, CSS and JavaScript, no libraries and no build step. Every painting is drawn in SVG and split into layers that slide at different speeds (2.5D parallax).

## The story

0. **Once upon a time**: the cover opens on a Forest Hills Gardens style Tudor in Queens, lit up Dyker Heights style, and we step into the picture.
1. **Byte flies to the city**: Shiqi's drone, Byte, flies over Queens rooftops, the East River and the Queensboro Bridge to a snowy Central Park facing Billionaires' Row, and *The Shiqi York Times* slaps onto the screen.
2. **A letter on the desk**: Shiqi writes at her desk (About me). Click the letter.
3. **The experience book**: the rolling ladder slides to a wiggling book on the shelf. Click it to flip through every role.
4. **The workshop**: pegboard tools, a live oscilloscope, a 3D printer, and three builds you can click or take apart. The sketch paper opens the toolbox.
5. **Honors**: a wall of framed certificates and honors, each clickable with its verification link.
6. **Off the clock**: Shiqi on her bed with her laptop and cat. The laptop opens Photos with hobby videos.
7. **The end**: Byte beams a hologram with her contacts across the skyline, the camera steps back out, and the book closes.

Scenes change with a storybook iris that opens around Byte. "Read it to me" turns on a narrator voice (the browser's built-in speech).

## Files

- `index.html` – the book, the chapter cards, the newspaper, the hologram and the dialogs (the letter text lives here)
- `data.js` – **all content**: projects, experience, certificates and honors, skills, builds, hobbies, contacts and photos
- `scenes.js` – the eight paintings, their camera moves and the narrator's lines
- `art.js` – painting helpers: the Tudor house, trees, the skyline and landmarks, the bridge, Shiqi, the cat, Byte
- `app.js` – scroll timeline, book camera, parallax, interactions and dialogs
- `styles.css` – the book, cards and dialogs

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
