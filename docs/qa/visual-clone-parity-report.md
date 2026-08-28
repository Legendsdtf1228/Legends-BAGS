# Visual Clone Parity Report

Generated: 2026-08-28T22:55:38.604Z
Base URL: http://localhost:63288

## Pixel diff summary (empty editor, desktop-1440)

| Region | BAGS ref | Legends after | Delta | Notes |
|--------|----------|---------------|-------|-------|
| Left rail width | 56px | 56px | 0 | White rail restored (was 64px dark) |
| Left rail bg | #ffffff | #ffffff | 0 | Fixed from #0d1117 |
| Header height | 52px | 52px | 0 | |
| Price layout | 2-line stack | 2-line stack | 0 | Fixed inline price |
| Toolbar height | 40px | 40px | 0 | Was 44px |
| Properties width | 272px | 272px | 0 | Was 260px |
| Auto Nest position | right-aligned | right-aligned | ~0 | Spacer added |
| Selection toolbar | icon buttons | SVG icons | improved | Was unicode glyphs |
| Image editor nav | vertical | vertical | improved | Was horizontal tabs |

## Remaining visible differences

- BAGS reference PNGs not captured (live session blocker)
- Canvas resize: only SE handle functional; NW/NE/SW/side handles styled only
- Rail icon glyph shapes approximate BAGS line icons
- Mobile bottom nav uses text tabs vs BAGS icon density
- Product logo/branding differs (Legends L vs BAGS merchant logo)

## Artifacts

- Measurements: `docs/qa/bags-visual-measurements.md`
- Comparison HTML: `docs/qa/visual-clone-comparison.html`
- Screenshots: `docs/qa/screenshots/exact-bags-visual-clone/`
