# Rage CTRL Generator

Mobile-first poster generator for the Rage CTRL image + Notes caption template.

## Run locally

```powershell
python -m http.server 5173 --bind 0.0.0.0
```

Open `http://localhost:5173` on the computer.

For your phone, keep the computer and phone on the same Wi-Fi, run `ipconfig`, copy the computer's IPv4 address, then open:

```text
http://YOUR-IP:5173
```

Example: `http://192.168.1.23:5173`.

## Phone use

- Upload from gallery or camera.
- Drag the preview to reposition the photo.
- Adjust text size for the caption.
- Move the caption up or down inside the Notes box.
- Leave Manual lines on to make Enter/newlines in the text box become real caption lines.
- Adjust zoom and offsets.
- Tap Reset or the small `0` buttons to return positioning values to neutral.
- Tap Save to download the PNG.
- Tap Share on phones that support the Web Share API.

The caption uses `GeistMono-Bold.ttf` from the provided font package, and the poster uses the provided PNG template as an overlay.
With Markdown green enabled, wrap part of the caption in asterisks to color it with the template logo green, for example `Aerozen *verde* text`.
The image layer continues underneath the template fade, so the transition into the Notes card stays smooth.

For home-screen install as a real PWA, host the folder over HTTPS with something like GitHub Pages, Netlify, or Vercel. Safari and Chrome can then add it to the phone home screen.
