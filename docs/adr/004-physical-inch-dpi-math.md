# ADR-004: Exact physical inches and 300 DPI raster math

## Status
Accepted

## Context
BAGS reprocess-width bugs distorted aspect ratios. Print fidelity is critical.

## Decision
- All layout math uses inches as the source of truth (floating point with rounded pixel conversion only at raster edges)
- `px = round(inches * 300)` for output dimensions; placement uses the same rule consistently
- Regeneration must re-read original assets and immutable design state — never re-scale from a previous output PNG
- Golden tests assert pixel W/H, alpha presence, and placed bounds

## Consequences
- Forbids “scale the last PNG” shortcuts
- Aspect lock applies in inch space before pixel rounding
