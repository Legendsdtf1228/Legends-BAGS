# ADR-003: DB-backed job queue for render workers

## Status
Accepted

## Context
Rendering long sheets can exhaust memory and must survive process restart. No Redis/Docker assumed in Phase 1.

## Decision
Persist `RenderJob` rows; a worker loop claims jobs with optimistic locking (`queued` → `processing`). Retries increment `attempt`. Worker restart resumes remaining `queued` jobs and fails stuck `processing` jobs past a lease timeout back to `queued`.

## Consequences
- Simple, testable recovery
- Single-process worker sufficient for dev; horizontal workers need row locking (PostgreSQL later)
