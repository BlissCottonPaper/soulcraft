# Soulcraft Reel Generator

Local render engine ("Cody") for platform-ready vertical reels — The Art of Soulcraft.
Produces **9:16 · 1080×1920 · 30fps · H.264 MP4 (AAC audio, yuv420p)**, the one master
format that ships to TikTok, Instagram, YouTube Shorts, Facebook, and Pinterest.

> **Runs locally / in CI — not deployed to Cloudflare.** Video rendering is a batch job
> (headless Chromium + ffmpeg), not a serverless request.

It **reuses the site's own mandala drawing and palette** (`assets/soulcraft-data.js`):
twelve archetype axes, `hue = index × 30`, the five bandwidth stage dots per axis
(Devolved rim → Transcendent center), the white-ringed Base dot, the white center dot —
on the site's dark-navy field, set in its literary serif (Cormorant). No colors are
reinvented here.

---

## Install

```bash
cd tools/reel-generator
npm install
```

That pulls **playwright-core** (drives the pre-installed Chromium) and, as optional deps,
**ffmpeg-static** / **ffprobe-static** (a full ffmpeg with H.264 + AAC). If those optional
binaries can't be fetched, the tool falls back to a system `ffmpeg`/`ffprobe` on your
`PATH` (must have libx264 + aac), or to the paths in `FFMPEG_PATH` / `FFPROBE_PATH`.

Requirements: Node 18+, a Chromium that Playwright can find (set `CHROMIUM_PATH` to
override), and ffmpeg with **libx264** and **aac**.

---

## CUSTOM mode — the product (audio-driven)

**The audio drives the timeline.** Total length = audio duration + lead-in (0.5s) + tail
(1.0s). The brief's scenes are distributed across the voiceover proportionally (unless a
scene pins its own timing), so builds and text land on Marc's phrasing.

```bash
# Marc's voiceover (.wav / .mp3 / .m4a) + a visual brief (.json or .txt)
node src/cli.mjs \
  --audio ./voiceovers/what-are-the-twelve.wav \
  --brief ./samples/sample-brief.json \
  --out  ./out/twelve.mp4

# Fast low-res draft (540×960) while iterating:
node src/cli.mjs --audio ./voiceovers/take1.m4a --brief ./samples/sample-brief.txt --preview
```

If you omit `--out`, the file is named by convention:
`soulcraft-reel-custom-<slug>-<yyyymmdd>.mp4` (drafts get a `-preview` suffix).

### No voiceover handy? Make a placeholder to test audio-driven timing:

```bash
ffmpeg -f lavfi -i "sine=frequency=180:duration=9" -ac 1 -ar 44100 ./placeholder.wav
node src/cli.mjs --audio ./placeholder.wav --brief ./samples/sample-brief.json
# → 10.5s reel (9.0 audio + 0.5 lead + 1.0 tail)
```

### Brief format

A brief says **what** happens; the audio says **when**. JSON:

```json
{
  "title": "What are the twelve archetypes",
  "kicker": "the twelve archetypes",
  "mood": "dark",
  "scenes": [
    { "text": ["What are the twelve archetypes?"], "elements": ["center", "halo"], "mood": "bright" },
    { "text": ["Twelve voices.", "Present in everyone."], "elements": ["mandala", "center"], "weight": 1.2 },
    { "text": ["Some speak loudly.", "Some speak quietly."], "elements": ["bandwidth"] },
    { "text": ["You are all twelve."], "elements": ["mandala", "center"], "mood": "bright", "ignite": "Warrior" }
  ]
}
```

Per-scene fields:

| field | meaning |
|---|---|
| `text` | on-screen line(s), literary serif, auto-fit and safe-zoned |
| `elements` | layers to show: `mandala` · `bandwidth` · `mindsets` · `wheel` · `center` · `halo` |
| `ignite` | archetype to spotlight (its spine brightens, others dim) — e.g. `"Warrior"` |
| `mood` | `dark` (default) or `bright` (adds glow, brighter ink) |
| `weight` | proportional share of the timeline (default `1`) |
| `at` / `pct` / `dur` | pin an explicit start (seconds / fraction) and/or duration (seconds) |

Plain-text briefs work too — paragraphs are scenes, `[elements: …]` / `[ignite: …]` /
`[mood: …]` / `[weight: …]` directives tune a scene, and a leading `kicker:` / `title:`
sets those. See `samples/sample-brief.txt`.

---

## PRESET modes (secondary; silent)

Prebuilt briefs from the system's own content — same pipeline, no audio (quoteloop loops
seamlessly).

```bash
node src/cli.mjs --mode morph                              # the master Mandala Morph
node src/cli.mjs --mode spotlight --archetype Warrior      # one spine ignites
node src/cli.mjs --mode quoteloop --text "You are all twelve."   # seamless loop
node src/cli.mjs --mode axial --archetype Lover            # an axis + its question
node src/cli.mjs --mode mindset                            # two voices fuse
node src/cli.mjs --mode bandwidth --archetype Sage         # five stages, dark→light
node src/cli.mjs --mode sixplusone                         # needs are soil, volition the seed
node src/cli.mjs --mode pattern --text "Catastrophizing | “If I picture the worst…” | The gift: foresight."
node src/cli.mjs --mode definition --text "Autonomy is not independence. | It is choosing what you’re already bound to."
```

`--text` accepts `|`-separated segments (each becomes a beat/line).

---

## Output guarantees

- **MP4 · H.264 (libx264) · AAC · yuv420p · 1080×1920 · 30fps · CRF ~19 · +faststart**
- Text stays inside the central 80% width and clear of the bottom 15% (platform UI).
- Dark-navy field, the site's mandala palette, Cormorant serif.
- **Never GIF.** Ask for `.gif` and it refuses and writes `.mp4`.

## All options

```
--audio <f>        voiceover (.wav/.mp3/.m4a) — CUSTOM
--brief <f>        visual brief (.json/.txt)  — CUSTOM
--mode <name>      preset mode                — PRESET
--archetype <x>    subject for spotlight/axial/bandwidth/mindset
--text "<...>"     copy for quoteloop/pattern/definition (| separates beats)
--out <file.mp4>   output path (default: soulcraft-reel-<mode>-<slug>-<date>.mp4)
--preview          540×960 fast draft
--lead-in <sec>    default 0.5     --tail <sec>   default 1.0
--duration <sec>   morph/quoteloop length
--fps <n>          default 30      --crf <n>      default 19
--slug <text>      filename slug   --keep-frames  keep intermediate PNGs
-h, --help
```
