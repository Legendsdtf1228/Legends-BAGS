# Editor Modern Parity — BAGS vs Legends

Sprint branch: `sprint/editor-modern-parity`  
Dev store: `legends-bags-in2lwdll.myshopify.com`  
Launcher: `https://legends-bags-in2lwdll.myshopify.com/apps/legends-bags/builder?type=gang_sheet`

## Reference test layout (BAGS baseline)

- Sheet: **22.5 × 36 in**
- **4 copies** of one transparent PNG
- Checkerboard transparency visible
- Inch rulers, overlap + resolution indicators
- Live price (~$29 on reference)
- Save + Save & Add to Cart
- Auto Build / Auto Nest → unified as **Auto Arrange** in Legends

Capture paired screenshots at **1440×1000**, **1280×800**, **390×844**, **430×932**.

## Phase checklist

| Phase | Requirement | Legends status |
|-------|-------------|----------------|
| 1 | Stable app-proxy launcher, same-tab fallback, no tunnel in theme | Done — `/apps/legends-bags/` + iframe timeout → same-tab |
| 2 | Modern command bar (left/center/right), unsaved indicator | Done — `GangSheetCommandBar` |
| 3 | Tool rail + panels (Uploads…Help) | Functional — polish ongoing |
| 4 | Canvas workspace, rulers, grid toggle, fit-width for tall sheets | Done — smart zoom + minimap |
| 5 | Selection handles + properties inspector | Functional |
| 6 | Compact Quality inspector (replaces permanent legend) | Done — `QualityInspectorPanel` |
| 7 | Unified Auto Arrange | Done — renamed; full-screen flow retained |
| 8 | Layers panel | Functional |
| 9 | Sheet size + pricing + shrink confirm | Partial — confirm before shrink pending |
| 10 | Welcome Center cards | Functional |
| 11 | Save dialog with warnings | Done — `GangSheetSaveDialog` |
| 12 | Mobile bottom nav + drawers | In progress — bottom bar updated |
| 13 | Design tokens + shared components | Done — `editor-tokens.ts`, extracted styles |
| 14 | Accessibility | Partial — focus rings, Escape, aria labels |
| 15 | Performance | Partial — no full rerender audit yet |
| 16 | Final-render integrity | Covered by existing pipeline tests |

## DPI quality categories (Legends)

| Tier | Range | UI |
|------|-------|-----|
| Excellent | ≥300 DPI | Green badge |
| Good | 250–299 | Blue badge |
| Low | 200–249 | Amber badge + explanation |
| Poor | <200 | Red badge + explanation |

## Screenshot matrix

| View | Desktop | Mobile | BAGS match | Legends improvement |
|------|---------|--------|------------|---------------------|
| Welcome Center | ☐ | ☐ | | |
| Empty sheet | ☐ | ☐ | | |
| Four-copy layout | ☐ | ☐ | | |
| Selected artwork | ☐ | ☐ | | |
| Uploads | ☐ | ☐ | | DPI tier badges |
| Gallery | ☐ | ☐ | | API-driven gallery |
| Text | ☐ | ☐ | | |
| Names & Numbers | ☐ | ☐ | | |
| Auto Arrange | ☐ | ☐ | | Unified naming |
| Layers | ☐ | ☐ | | |
| Quality inspector | ☐ | ☐ | | Compact vs permanent legend |
| Save dialog | ☐ | ☐ | | |
| Tall sheet + minimap | ☐ | ☐ | | Fit-width + minimap |

## Browser QA script

1. Open Gang Sheet Builder from dev product
2. Set **22.5 × 36 in**
3. Upload transparent PNG → add **4 copies**
4. Resize/rotate one copy; multi-select two; align
5. Verify overlap + DPI in **Quality** panel
6. Run **Auto Arrange** → undo → regenerate → apply
7. Change sheet size → undo
8. **Save** → reopen from Saved Designs
9. **Save & Add to Cart** → verify cart line properties
10. Repeat on **390×844**

## Remaining limitations

- Shrink-sheet confirmation with scale-to-fit option
- Font picker live previews; Names column-mapping wizard
- Pinch zoom on mobile
- Full paired BAGS screenshots not yet captured
- Gallery seed SVGs still used when API empty (dev only)

## Commands

```bash
npm run test
npm run typecheck
npm run build
cd extensions/upload-by-size && shopify theme check
node scripts/gang-sheet-editor-screenshots.mjs
```
