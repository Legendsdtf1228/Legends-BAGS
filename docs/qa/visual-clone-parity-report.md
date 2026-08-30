# Visual Clone Parity Report

Generated: 2026-08-28T23:06:52.098Z
Base URL: http://localhost:53832

## Pixel diff summary (desktop-1440)

| Region | BAGS ref | Legends after | Delta | Notes |
|--------|----------|---------------|-------|-------|
| Left rail width | 56px | 56px | 0 | White rail |
| Left rail bg | #ffffff | #ffffff | 0 | |
| Header height | 52px | 52px | 0 | |
| Toolbar height | 40px | 40px | 0 | |
| Properties width | 272px | 272px | 0 | |
| Bottom nav (mobile) | icon+label ~52px | icon+label ~52px | ~0 | Icons added sprint 2 |
| Canvas resize handles | 8 + rotate | 8 + rotate | 0 | All handles wired |
| Selection toolbar | icon buttons | SVG icons | ~2px | Glyph stroke weight |
| Image editor nav | vertical 112px | vertical 112px | ~0 | |
| Logo mark | merchant logo | Legends L | n/a | Branding differs |

## Remaining visible differences

- BAGS reference PNGs not captured — manual steps in `docs/qa/bags-visual-measurements.md`
- Rail icon glyph shapes approximate BAGS line icons (~1–2px stroke variance)
- Mobile bottom nav label truncation on narrow tabs vs BAGS shorter labels
- Product logo/branding differs (Legends L vs BAGS merchant logo)
- Active gang sheets drawer opens via hidden mobile nav button on desktop (BAGS may expose header entry)
- Four-copy sheet layout spacing may differ ±4px from BAGS nest positions without live reference

## Captured legends-after states (desktop-1440)

- `legends-after/desktop-1440/empty-editor.png`
- `legends-after/desktop-1440/uploads.png`
- `legends-after/desktop-1440/four-copy-sheet.png`
- `legends-after/desktop-1440/selected-artwork.png`
- `legends-after/desktop-1440/image-properties.png`
- `legends-after/desktop-1440/enhance-modal.png`
- `legends-after/desktop-1440/names-numbers.png`
- `legends-after/desktop-1440/settings.png`
- `legends-after/desktop-1440/active-gang-sheets.png`

## Artifacts

- Measurements: `docs/qa/bags-visual-measurements.md`
- Comparison HTML: `docs/qa/visual-clone-comparison.html`
- Screenshots: `docs/qa/screenshots/exact-bags-visual-clone/`
