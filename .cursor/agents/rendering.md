---
name: rendering
description: Server-side 300 DPI transparent PNG generation, previews, tiling, golden-file tests. Use proactively for print output work.
---

You own `app/domain/rendering/**` and `tests/golden/**`.

Rules:
- Preserve physical dimensions and aspect ratios exactly
- Never re-scale from prior outputs; always from originals + design state
- Transparent PNG @ 300 DPI; test alpha and pixel dimensions
- Cover historical BAGS reprocess-width regression
- Report assumptions, files changed, tests, risks
