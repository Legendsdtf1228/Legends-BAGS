# QA fixtures (dev-only)

Automated and browser QA use checked-in artwork — no manual upload dependency for parity checks.

## Reference gang-sheet image

| Field | Value |
|-------|--------|
| Path | `tests/fixtures/qa-reference-11x11.png` |
| Pixel size | 990 × 1015 px |
| Print size | 11.00 × 11.28 in (aspect ≈ 0.98) |
| Effective DPI at 11″ | ~90 DPI (intentionally low for FitCheck / upscale tests) |

Regenerate:

```bash
node scripts/generate-qa-fixture.mjs
```

## Browser acceptance checklist

Use this image to verify:

1. Upload / place one copy on 22.5×24 — properties show W/H, aspect, DPI tier
2. Auto Fill Sheet — expect ≥4 copies with default spacing
3. Switch sheet to 22.5×36 — resize, rotate, duplicate, overlap warning
4. Auto Nest — fitted/remaining report before apply; Ctrl+Z undo
5. Auto Build — multi-qty from uploads panel
6. Names & Numbers — separate Add Names / Add Numbers + CSV
7. Image Editor — Enhance/Halftone/Crop/Colors tabs with real preview (no fake success)
8. Save dialog — DPI tiers and overlap/OOB warnings

Do **not** use seeded customer Gallery items as merchant artwork in parity evidence.
