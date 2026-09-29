# Metropolis submission preparation

Prepared 2026-09-29. Target: https://www.monad.xyz/developers/hackathons/metropolis

## Submission draft

**Project:** DevClans TradeGuard

**Pitch:** Turn trade agreements into reviewed terms, delivery evidence and accountable escrow settlement. Buyers and suppliers approve the same agreement; a named arbitrator resolves disputed deliveries. Qwen suggests structured terms, while people and wallet-authorized contract calls control payments.

**Demo story:** Kano Foods orders 100 bags of white maize from Savannah Grains. The invoice is NGN 4,200,000; the separate demonstration settlement is 2,500 no-value TGT. A delivery declaration records 90 bags. The buyer disputes the ten-bag shortage. The arbitrator allocates 2,250 TGT to the supplier and 250 TGT to the buyer; each withdraws independently.

**Monad integration:** Solidity escrow with immutable accepted terms commitments, named wallet roles, exact token funding, dispute and mutual settlement paths, and pull withdrawals. Documents remain off-chain. The private sandbox and wallet escrow are separate workflows.

**Suggested track:** Consumer Products & Payments, subject to the current official form. AI extraction is an integration, not autonomous arbitration.

The official event page and track page could not be retrieved during this run. Confirm the exact deadline/timezone, track, eligibility, required video duration, repository access and sponsor criteria in the official portal before submitting. Do not represent this preparation as a submitted entry.

## Singapore Qwen setup

Use server-side runtime settings:

```text
QWEN_ENABLED=true
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
QWEN_API_KEY=<configure as a secret, never in client code>
```

Alibaba also recommends the workspace-specific Singapore URL:
`https://<WorkspaceId>.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`.
The key must belong to the Singapore workspace and have permission for the selected model. Qwen Plus is a starting configuration, not a benchmark winner. The adapter requests JSON with thinking disabled and validates returned fields and quotes. Schema-valid values can still be incorrect; compare all fields with the source.

Sources checked 2026-09-29:
- https://www.alibabacloud.com/help/en/model-studio/model-calling-in-sub-workspace
- https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-dashscope

No QWEN environment variable names were present in this local process. The reply "Singapore" confirms region, not that a hosting secret is configured. Live model accuracy and connectivity remain unverified until the runtime is configured and a synthetic request succeeds. Mocked adapter tests are not a live-model benchmark.

## Recording runbook

1. Sign in to the protected published workspace. Open New trade, Use sample text, Extract terms. Show the actual provider label. The sample shortcut skips extraction, so do not use it to demonstrate Qwen.
2. Compare all extracted fields with the source: 100 bags, 42,000 NGN per bag, 2,500 TGT, 48-hour review, named parties and arbitrator. Save.
3. Approve as buyer, switch to supplier and approve. Switch to buyer and fund demo escrow.
4. Switch to supplier. Record 90 bags, a note describing ten missing bags, and a synthetic evidence attachment. Download it to check persistence.
5. Switch to buyer. Show the ten-bag discrepancy, then dispute. Show that ordinary delivery acceptance is unavailable.
6. Switch to arbitrator. Resolve at 90 percent to supplier with an evidence-based reason. Show supplier 2,250 TGT and buyer 250 TGT.
7. Withdraw as buyer, then supplier. Show zero remaining demo escrow, both withdrawal confirmations, activity history and exported record. Refresh and verify the result persists.
8. Explain that the role selector is a private simulation. For the separate Monad segment, use three distinct test wallets and deployed TGT/escrow addresses; record successful receipts for create, accept, token allowance, fund, evidence, dispute, resolve and both withdrawals. Never label sandbox activity as blockchain transactions.

## Before final submission

- Confirm a working judge-accessible URL; the existing prototype is private and its hosting ownership was not transferred with this source archive.
- Complete authenticated browser verification including evidence upload/download, refresh, export, unauthenticated denial and cross-owner denial.
- Configure Singapore secrets securely and run synthetic extraction; capture the model, date, fields and errors without keys.
- Deploy to Monad testnet only with authorization and testnet MON; verify token code, six decimals, escrow token address and chain 10143. No-value TGT only.
- Provide repository access and a clear record of work in the eligible build window, team details, video and deployment receipt links required by the actual form.
- State prototype limits: no audit; advisory deadlines; unavailable arbitration plus refusal of mutual settlement can lock funds indefinitely; evidence declarations do not prove physical delivery.

## Reproducible local checks

```text
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node --import tsx --test tests/domain.test.ts tests/extraction.test.ts
node scripts/compile-contracts.mjs
node --test tests/contracts.test.mjs
pnpm build
```

The provider tests use synthetic mocked responses; contract tests deploy to an in-process local EVM. Neither proves live Singapore Qwen, deployed Monad transactions, or authenticated browser behavior. See VERIFICATION.md for this run's actual results.

### Built-worker verification alternative (passed)

When the development server fails, build first and initialize/start the worker using the same explicit local state directory:

```text
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sturdy_microchip.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --local --config dist/server/wrangler.json --persist-to .wrangler/state --ip 127.0.0.1 --port 8787 --inspector-port 0
node --import tsx scripts/verify-local-worker.ts
```

Apply the schema once per fresh local database. The test deliberately injects trusted identity fixtures only into localhost. It verifies application ownership checks, not the hosted sign-in/ingress boundary. Do not expose this worker directly to the internet.
