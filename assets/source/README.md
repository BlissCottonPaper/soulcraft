# Source artwork

Untouched, full-resolution source assets. Committed as-is; production sizes are
derived from these by a repeatable script (never hand-edited).

## lantern-original.png

The Lantern icon source (1254×1254). **Note:** this file has a solid (white)
background — no alpha channel — with the amber glow rendered on white. The
pipeline handles that: `scripts/process-lantern.mjs` derives transparency from the
white field (white → transparent, the amber glow preserved as a soft haze),
crops to the glow-inclusive bounding box, applies the 87% vertical scale, and
exports the two production icons.

Regenerate the icons any time (a lantern swap is the same one step):

```bash
node scripts/process-lantern.mjs
# writes:
#   assets/lantern-48.png   (@1x, 33×48)  → /assets/lantern-48.png
#   assets/lantern-96.png   (@2x, 65×96)  → /assets/lantern-96.png
```

If a **truly transparent** lantern PNG is ever provided, drop it here in place of
this one and re-run — the script detects the real alpha channel and trims to it
directly (skipping the white-derivation step), for an even cleaner cutout.

The Lantern element in `/companion` references those two paths via `srcset` at
48px with explicit width/height (no layout shift).
