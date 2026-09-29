# TradeGuard continuation handoff

DevClans TradeGuard: agreement extraction and review, buyer/seller approvals, delivery evidence, dispute resolution, escrow on Monad.

This archive contains source commit 18d204dcf367889b66fbab873bb7622e59270e67. It excludes dependency installations, runtime credentials, and live database/files. It does not transfer chat history or hosting ownership.

Published private prototype: https://devclans-tradeguard.alhibb.chatgpt.site

Read README.md, docs/CONTRACT_REVIEW.md, app/tradeguard.tsx, app/testnet.tsx and contracts/src/TradeGuardEscrow.sol first. React/TypeScript, Vinext, Cloudflare D1/R2, Solidity, viem. Preserve existing project files when importing; inspect conflicts before overwriting.

Prior verification: TypeScript check and production build passed; five domain and five local EVM contract tests passed. Authenticated browser end-to-end flow remains unverified. No live Qwen credentials configured and no Monad contract deployed. Current roles and balances in the demo are simulated. Qwen was provisional based on interest in Chinese AI; no model benchmark proves it best. Do not activate paid API use, deploy contracts, or use real funds without the user's authorization.

Next: install dependencies from the lockfile; inspect scripts/execution-profile.mjs and README for local setup; run typecheck, domain tests and contract tests; verify sample 100-bag trade with 90-bag delivery, dispute, 90/10 settlement and withdrawals. Preserve trusted authentication boundaries. Deployment outside Sites needs explicit auth/storage adaptation. Do not treat oai-authenticated headers as trustworthy on an unprotected public server.

Contract limits: advisory deadlines, indefinite lock if arbitration is unavailable and counterparties refuse mutual settlement; prototype, not audited. Disputes invalidate prior mutual proposals; owner renunciation is disabled. Only supplied TGT test token is supported.

## Continuation on 2026-09-29

See docs/METROPOLIS_SUBMISSION.md for the submission draft, Singapore Qwen setup and recording runbook; docs/VERIFICATION.md for evidence and remaining blockers.

Installed locked dependencies. Added lib/tradeguard/extraction.ts and its tests; authenticated extraction route now delegates to it. Added exact demo and consent-revocation escrow tests. Fixed remaining escrow display after withdrawals. Explicitly disabled two optional native dependency builds in pnpm-workspace.yaml.

Verified: 11 domain/extraction tests, 7 local EVM tests, Solidity compilation, TypeScript, production build after extraction changes. Live Qwen and Monad deployment remain unconfigured/unverified. User supplied https://monad.xyz/developers/hackathons/metropolis and confirmed Singapore region; no credential configuration location supplied. No paid API calls, deployment, publication or submission performed.

Local dev startup failed twice with ECONNRESET. Browser automation timed out twice. scripts/verify-local-demo.ts is ready for localhost port 5173, using the existing localhost-only sign-in fixture; initialize local D1 tables from drizzle/0000_sturdy_microchip.sql before running it. It creates synthetic records and tests upload/download and persistent settlement. Do not confuse this fixture with production authentication.

Final verification update: final production rebuild passed. Although Vinext dev startup failed, the built Wrangler worker ran successfully on localhost:8787. scripts/verify-local-worker.ts passed the entire D1/R2 API workflow, including evidence bytes downloaded intact, stored settlement after retrieval, stale-version/cross-origin/unauthenticated denial, and cross-owner order/action/file denial. Synthetic record TG-99654F: 2250 TGT seller, 250 buyer, both withdrawn. This script injects trusted test identities into loopback worker requests; it does not validate production ingress or browser sign-in.

For repeatable local worker checks, build FIRST, then use the same explicit --persist-to .wrangler/state argument for both local D1 initialization and wrangler dev. This avoids storing data inside dist where rebuilds remove it. Start on 127.0.0.1:8787 and run node --import tsx scripts/verify-local-worker.ts. Do not use the fixture against a remote service.

## Minimalist UI and local launcher update

All app surfaces restyled with warm-white panels, forest-green actions, restrained borders, responsive spacing and lighter typography. `.env` created with blank Singapore Qwen key and QWEN_ENABLED=false; `.env.example` is shareable, `.env` stays ignored. Never print the populated file in future turns.

Run `pnpm build` then `pnpm local`. scripts/start-local.mjs initializes local D1 idempotently, reads .env explicitly through Wrangler, and serves a loopback-only sign-in proxy at http://127.0.0.1:5173 with worker at 8787. It strips incoming identity/forwarded headers and rejects cross-origin requests. Local state lives outside dist at .wrangler/state. Logs: .sites-runtime/local-worker.log. This is a local preview helper only, not a production authentication replacement.

Verified TypeScript and production build; complete scripts/verify-local-demo.ts passed through the proxy, including spoofed-header rejection and both withdrawals. Browser sign-in, dashboard rendering and new-trade dialog visually checked in Codex browser tab 3. Local server left running (execution session 47749). No deployment or paid Qwen call performed. Restart the launcher after changing .env.
