# Verification record — 2026-09-29

## Passed in this workspace

- Frozen-lockfile dependency installation using pnpm 11.25.0, Node 24.13.0. Optional bufferutil and utf-8-validate native builds are explicitly disabled; existing mandatory build policy is preserved.
- TypeScript (`pnpm exec tsc --noEmit`), including final adapter, UI balance and local verification script.
- 11 domain/provider-adapter tests: approval and role guards, terminal state behavior, allocation conservation, 30 deterministic fixtures, malformed/truncated Qwen responses, invalid field abstention, source quote filtering, Singapore request construction, disabled-provider behavior, and complete 100/90-bag dispute with 2250/250 TGT and both withdrawals.
- Solidity compilation and 7 in-process EVM tests: permissions, repeated payout rejection, disputes, exact mutual splits, pause behavior, generated multi-order accounting, the full demo allocation with token balance checks, dispute invalidation of prior consent and rejected ownership renunciation.
- Final production build passed after the balance display correction.

Ganache used its JavaScript fallback because its optional uWS binary does not support this Node version. All seven tests completed successfully.

## Changes made

Provider extraction moved into a runtime-independent module used by the authenticated route. It rejects incomplete responses, handles malformed source arrays safely, returns schema-normalized fields, produces warnings from actual model fields, verifies quotes occur in source, and explicitly disables thinking for JSON extraction. No keys are logged or stored in source. Model suggestions still require human review; quote filtering does not prove every field is supported.

The escrow detail panel now subtracts withdrawn allocations, reaching zero once both participants withdraw. Previously it displayed the original amount indefinitely.

Added `scripts/verify-local-demo.ts` for the real localhost API workflow: local sign-in, denied unauthenticated and spoofed-header requests, extraction, saved order, stale-version rejection, evidence upload/download, dispute, resolution, both withdrawals, persistence and cross-origin rejection. It creates synthetic local records. The development-server variant has not run. The built-worker variant, scripts/verify-local-worker.ts, passed the complete workflow using explicit loopback-only trusted identity fixtures, plus cross-owner list/action/file denial. It does not test Sites sign-in or ingress header sanitization.

## Not verified / submission blockers

- Local Vinext dev startup twice failed with `read ECONNRESET`. The built Wrangler worker started successfully; D1/R2 persistence and full API workflow passed on port 8787 (synthetic trade TG-99654F). Browser-based dev sign-in remains unverified.
- Browser automation timed out in both in-app and Chrome sessions. Authenticated browser flow, PDF import, downloads/export and judge access are unverified.
- No local QWEN variable names were configured. Singapore region was confirmed by the user, but hosting secret status remains unknown. No paid provider call was made; no live-model accuracy claim is justified.
- No contract deployment or testnet wallet transaction was made. Deployment receipts and three-wallet walkthrough remain required.
- The existing private published Site was not changed. Its ownership/access did not transfer with the source archive.
- Official Metropolis page/track pages could not be retrieved; validate the current submission form and sponsor rules directly. No entry was submitted.

Do not expose the production worker on an unprotected host: its authenticated headers require the trusted Sites ingress. Existing localhost mock authentication is development-only and was not expanded.

