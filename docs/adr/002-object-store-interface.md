# ADR-002: Local filesystem storage with S3-shaped interface

## Status
Accepted

## Context
Docker/S3 may be unavailable in early development. Production needs object storage with signed access.

## Decision
Implement `ObjectStore` interface with `LocalObjectStore` (dev) and later `S3ObjectStore`. Signed URLs are app-issued HMAC links that stream via our download route (works for both backends).

## Consequences
- No cloud credentials required for vertical slice
- Path layout documented in data-model.md
- Never put absolute local paths or signed URLs in fixtures/logs
