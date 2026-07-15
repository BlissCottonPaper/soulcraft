# Source artwork

Untouched, full-resolution source assets. Committed as-is; production sizes are
derived from these by a repeatable script (never hand-edited).

## lantern-original.png  — PENDING

The Lantern icon source (photorealistic bronze lantern, transparent background,
warm amber glow). **Not yet committed** — the paste in the build request did not
reach the build environment as a usable transparent file (only a flattened,
no-alpha preview was retrievable, which would lose the glow).

**To finish the Lantern icon:**

1. Drop the real 1024×1024 transparent PNG here as `lantern-original.png`.
2. Run the repeatable pipeline:

   ```bash
   node scripts/process-lantern.mjs
   ```

   It trims to the artwork's **alpha bounding box** (glow included — never cropped
   tighter than the alpha), then exports high-quality Lanczos downscales:

   - `assets/lantern-48.png`  (@1x, 48px longest side)  → `/assets/lantern-48.png`
   - `assets/lantern-96.png`  (@2x, 96px longest side)  → `/assets/lantern-96.png`

The Lantern element in `/companion` already references those two paths via
`srcset` at 48px with explicit width/height (no layout shift; the icon simply
appears once the exports exist). A future lantern swap is the same two steps.
