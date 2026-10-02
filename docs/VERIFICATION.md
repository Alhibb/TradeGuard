# Verification record — 2026-10-02

## Passed in this run

- TypeScript: `pnpm exec tsc --noEmit`. Fixed a typed-key indexing error in the live Qwen verification helper discovered during this run.
- Domain/extraction: 11/11 tests passed.
- Solidity compilation and local EVM: 7/7 tests passed. Full 2500 TGT funding, 2250/250 allocation and both withdrawals, role/consent checks, pause behavior and multi-order accounting are covered. Ganache used its JavaScript fallback on Node 24.
- Production build: passed after the user stopped the previous preview, which had locked `dist` on Windows.
- Local launcher: rebuilt app running at http://127.0.0.1:5173/, worker on 8787, persistent local D1/R2 state retained.
- Runtime config: HTTP 200, Qwen enabled (`qwen-plus`), chain 10143, deployed token/escrow addresses match README.
- Complete API demo: `verify-local-demo.ts` PASS, trade TG-98823D. Qwen extraction exactly matched all sample terms; buyer/supplier approvals; 2500 TGT sandbox funding; evidence upload and exact downloaded bytes; 90-bag delivery; dispute; 2250 supplier/250 buyer; both withdrawals; saved record retrieval; unauthorized, spoofed-header, stale-version and cross-origin rejection.
- Built-worker API checks: `verify-local-worker.ts` PASS, trade TG-4209B6. The same workflow plus cross-owner order/action/file denial. Uses local trusted identity fixtures, not production ingress.
- Browser: local sign-in, overview, sample agreement import and real Qwen review label/fields, persisted settled agreement, 10-bag evidence discrepancy, both withdrawal events and zero remaining sandbox escrow, mobile sidebar navigation, configured Monad create/load controls.
- Screenshots: actual browser JPEGs under `docs/screenshots/`, linked from README. Captures contain synthetic data.
- Monad read-only checks: `verify-testnet.mjs` PASS. Contract code exists; chain 10143; escrow token matches configured TGT; symbol TGT; six decimals; owner 0x70D98e179e3Ce71FdE8Ed784fA79C542D5bDEB11. Next trade ID: 1.
- Official Metropolis page was read in-browser. It requests a working product, public project profile, demo, short write-up and code link. Its application link is https://hackathon.monad.xyz/.

## Scope and remaining verification

No live-wallet trade was submitted by this run. Next trade ID 1 means the deployed escrow has no created trades at the time of the check. Local EVM tests and sandbox activity are not Monad transaction proof. Three funded distinct wallets and a user-signed rehearsal are required.

Browser PDF import and a complete UI-only create-to-withdraw walkthrough were not verified. End-to-end mutation coverage was through the local API scripts. Browser export was clicked, but the download observer timed out; exported-file retrieval is not counted as passed. Evidence byte retrieval passed through API checks.

A successful Qwen sample demonstrates connectivity and matching explicit fields for that fixture, not accuracy on unseen documents. Qwen output remains subject to human review.

Hosted Qwen and contract configuration, external judge access, recording and final submission remain outstanding. The hosted Site remains owner-only; local sign-in tests do not prove hosted authentication or judge access.

## Reproduce

See README for commands, deployment addresses, wallet runbook, screenshots and submission steps. Stop the Windows preview before rebuilding, then run `pnpm local`. API scripts create synthetic records and need the localhost server. Never run identity fixtures against a remote service or expose the raw worker publicly.
