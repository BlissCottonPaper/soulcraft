# Source artwork

Untouched, full-resolution source assets. Committed as-is; production sizes are
derived from these by a repeatable script (never hand-edited).

## lantern-original.png

The Lantern icon source (1254×1254), **baked on a flat navy field `#16112D`** (no
alpha, not white). `scripts/process-lantern.mjs` auto-detects this and builds a
contained **navy tile**:

1. snaps the near-`#16112D` field to exact `#16112D` (flattens compression noise —
   the committed file's corners drift a couple of levels from a lossy re-encode);
2. crops a centred **square** around the lantern with a comfortable margin;
3. applies the **87% vertical scale** (spec addendum);
4. pads back to a square `#16112D` tile and Lanczos-exports:

```
node scripts/process-lantern.mjs
#   assets/lantern-48.png   (@1x, 48×48)  → /assets/lantern-48.png
#   assets/lantern-96.png   (@2x, 96×96)  → /assets/lantern-96.png
```

The Lantern element's icon container in `/companion` uses `background:#16112D`
(matching the tile) + a thin low-contrast bronze border, so tile and image are
seamless and the icon reads as a deliberate contained element.

The script also handles two other source kinds automatically, for a future swap:
a **transparent** PNG (trims to the alpha bbox) or a **white-background** glow
(derives transparency from white, glow preserved).
