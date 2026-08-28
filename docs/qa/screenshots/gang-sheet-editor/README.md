# Gang Sheet Editor — visual acceptance screenshots

## Layout

- `before/` — pre–shell-redesign captures (commit `c5dcc4d` or earlier)
- `after/` — v2 shell grid captures (Playwright)

Each phase folder contains viewport subfolders:

| Viewport | Size |
|----------|------|
| `1440x1000` | Desktop |
| `1280x800` | Laptop |
| `1024x768` | Tablet landscape |
| `768x1024` | Tablet portrait |
| `430x932` | Mobile |
| `390x844` | Mobile narrow |

## Capture

With `npm run dev` running:

```bash
BASE_URL=http://localhost:56497 node scripts/capture-gang-sheet-screenshots.mjs after
```

For **before** shots, check out the prior commit in a separate worktree or restore `app/` + `tests/` to `c5dcc4d`, restart dev, then:

```bash
node scripts/capture-gang-sheet-screenshots.mjs before
```

## PR #11

Attach representative desktop (`1440x1000`) and mobile (`390x844`) pairs to the PR description. Full matrix lives under this directory.
