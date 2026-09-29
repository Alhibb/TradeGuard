# DevClans TradeGuard

A hackathon prototype that turns written trade agreements into a delivery and payment workflow, with a separate Monad testnet escrow workspace.

## What works

- Private ChatGPT sign-in, owner-scoped D1 trade records and R2 evidence files.
- Text/PDF agreement import, deterministic labeled extraction, manual review, immutable approved terms and activity history.
- Buyer/supplier approvals, simulated funding, delivery evidence, discrepancy checks, disputes, arbitrator splits and pull withdrawals.
- Optional server-side Qwen extraction. AI only suggests terms; it never moves funds or decides disputes.
- Solidity escrow, no-value six-decimal TGT faucet token, deployment script, and wallet UI for real Monad testnet transactions once configured.

The demo role selector is a private simulation, not multi-user authorization. Live testnet permissions are enforced by wallet addresses in the contract. Sandbox and chain trades are separate. No contracts have been deployed by this project yet.

## Development

Requires Node 22.13+ and pnpm. Run `pnpm install`, `pnpm dev`, `pnpm build`.

Checks:

```
pnpm exec tsc --noEmit
node --import tsx --test tests/domain.test.ts
node scripts/compile-contracts.mjs
node --test tests/contracts.test.mjs
```

D1 schema is in `db/schema.ts`; generated migration is in `drizzle/`. The hosting manifest provisions DB and BUCKET. Local migrations use Wrangler with the project's generated configuration.

## Optional Qwen

Configure server-side runtime secrets `QWEN_API_KEY`, and values `QWEN_ENABLED=true`, `QWEN_BASE_URL` (HTTPS OpenAI-compatible base URL), `QWEN_MODEL`. No provider call occurs without all four. Enabling Qwen sends agreement text to that provider and may incur usage charges. ChatGPT Plus is not an API credential. Provider output is untrusted and must be checked before saving. Without configuration, the app clearly labels the deterministic parser.

## Monad testnet

Compile contracts, then run `CONFIRM_TESTNET=yes node scripts/deploy-testnet.mjs` with `DEPLOYER_PRIVATE_KEY` supplied securely in the environment and testnet MON available. Never commit keys. The script checks chain 10143. Configure server runtime `ESCROW_ADDRESS`, `TOKEN_ADDRESS`, and optional `MONAD_RPC_URL` from the deployment output. Verify code/address and token decimals before use. The wallet must be on Monad testnet. The UI simulates each contract call before asking the wallet to sign and waits for a successful receipt. TGT has no monetary value; obtain it through DemoToken.faucet.

Keep the downloaded salted terms commitment and share it with the counterparty before hash acceptance. Chain data and transaction addresses are public; documents remain off-chain.

## Limits

This is not audited or production-ready financial infrastructure. Only the supplied standard TGT token is supported. Delivery/review deadlines are advisory after funding. The seven-day arbitration target is informational: unavailable arbitration and refusal of mutual settlement can lock funds indefinitely. There is no unilateral timeout payout. Pause preserves disputes, resolution, mutual agreement and withdrawals. Owner cannot sweep escrow; renunciation is disabled. Opening a dispute invalidates earlier mutual proposals.

Scanned PDFs need external OCR. Evidence comparisons are deterministic checks, not authenticity verification. The Qwen adapter has not been tested with live credentials. Demo tests do not establish model accuracy. Real wallet interaction requires configuration and was not exercised against deployed contracts.

See `docs/CONTRACT_REVIEW.md` for static review and `tests/` for executable checks. Built using the TradeGuard research blueprint supplied in this conversation, plus frontend, contract-review, testing and Sites guidance.

## Metropolis preparation

See [submission draft and demo runbook](docs/METROPOLIS_SUBMISSION.md) and [current verification evidence](docs/VERIFICATION.md). Provider adapter checks run with `node --import tsx --test tests/extraction.test.ts`. The synthetic persisted API workflow is in `scripts/verify-local-demo.ts`; it requires the localhost development server and initialized local D1 schema.

## Run locally on Windows

1. Add your Singapore Qwen key to `.env` and set `QWEN_ENABLED=true` when ready. Leave it false for the deterministic parser. The key stays server-side. Restart the launcher after editing this file.
2. Run `pnpm build` after source changes, then `pnpm local`.
3. Open http://127.0.0.1:5173 and choose **Sign in to your workspace**. This is a localhost-only demo identity, not production authentication.

The launcher initializes local D1 tables and retains D1/R2 data in `.wrangler/state`. It loads `.env` explicitly. `.env` is Git-ignored; `.env.example` contains empty placeholders only. The local worker runs on port 8787 behind a loopback-only sign-in proxy on port 5173. Neither port should be exposed publicly. Stop with Ctrl+C.
