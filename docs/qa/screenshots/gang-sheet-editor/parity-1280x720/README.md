# Gang sheet editor — 1280×720 BAGS parity screenshots

Side-by-side reference captures for PR #11 visual acceptance.

## Required states

| File | State |
|------|-------|
| `01-empty-editor.png` | Canvas loaded, no artwork |
| `02-artwork-selected.png` | One image selected |
| `03-add-image-modal.png` | Add Image modal |
| `04-names-numbers-modal.png` | Names & Numbers modal |
| `05-settings-modal.png` | Settings modal |
| `06-auto-build.png` | Auto Build flow |
| `07-save-dialog.png` | Save dialog |
| `08-save-cart-confirmation.png` | Save & Add to Cart confirmation |
| `09-active-sheets-drawer.png` | Active Gang Sheets drawer (right) |
| `10-four-image-22.5x36.png` | Four images on 22.5×36 sheet |

## Capture

```bash
npm install -D playwright
npx playwright install chromium
npm run dev   # separate terminal
BASE_URL=http://localhost:PORT node scripts/capture-gang-sheet-screenshots.mjs
```

Manual states (02, 06–08, 10) require uploaded artwork and save flow — capture after placing test images.
