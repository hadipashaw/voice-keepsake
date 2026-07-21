[README.md](https://github.com/user-attachments/files/30220801/README.md)
# A Keepsake, For You

A small, self-contained page for sending someone a voice note as a keepsake:
a tape case they tap open, a reel-to-reel player with a live audio-reactive
waveform, a message that reveals word by word, and a pinned keepsake photo.

Pure HTML/CSS/JS — no build step, no dependencies, works as-is on GitHub Pages.

## Folder structure

```
voice-keepsake/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── audio/
│   │   └── voice-note.mp3      ← placeholder tone, replace with your recording
│   └── images/
│       └── photo.svg           ← placeholder illustration, replace with your photo
└── README.md
```

## Customize

Open `js/script.js` and edit the `CONFIG` block at the top — that's the only
part you need to touch:

```js
const CONFIG = {
  recipientName: "You",
  senderName: "Someone",
  message: "Your message text goes here...",
  audioSrc: "assets/audio/voice-note.mp3",
  photoSrc: "assets/images/photo.svg",
  photoCaption: "a moment, pinned here",
  dateStamp: "" // leave empty to use today's date automatically
};
```

Then:

1. **Swap the audio** — drop your own recording in as
   `assets/audio/voice-note.mp3` (or point `audioSrc` at a different filename
   — `.mp3`, `.wav`, and `.ogg` all work).
2. **Swap the photo** — replace `assets/images/photo.svg` with a `.jpg` or
   `.png` of your own and update `photoSrc` to match.
3. **Edit the message** — this is what reveals word-by-word after the tape
   is opened.

Everything else (reel spin, waveform, scrubber, timestamps, reduced-motion
handling) works automatically off those values.

## Run it locally

Because the page loads a local audio file, open it through a small local
server rather than double-clicking the file (browsers block local audio
loading over the `file://` protocol in some cases):

```bash
cd voice-keepsake
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a new repository on GitHub and push this folder's contents to it:
   ```bash
   cd voice-keepsake
   git init
   git add .
   git commit -m "Voice note keepsake"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
4. Save. Your keepsake will be live at:
   `https://<your-username>.github.io/<repo-name>/`

To send it as a private-feeling link, you can rename the repo to something
unguessable, or move `index.html` into a subfolder with a random name (e.g.
`m/cc3e0f69/index.html`) so the URL isn't obviously guessable either.

## Notes

- The included `voice-note.mp3` is a placeholder soft tone so the player
  works out of the box — replace it before sharing the link.
- The waveform uses the Web Audio API when the browser allows it, and falls
  back to a gentle idle animation otherwise — it never blocks playback.
- Respects `prefers-reduced-motion`.
- No external services, tracking, or build tools — just the three files
  above.
