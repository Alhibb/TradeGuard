# Metropolis submission guide — 2026-10-02

## Verified official requirements

The official page https://monad.xyz/developers/hackathons/metropolis was read in the browser on 2026-10-02. Its application link is https://hackathon.monad.xyz/.

The FAQ requests a working product with a public project profile: a demo, a short write-up and a code link. It names 13 October as the deadline, judging 14–27 October and winners 3 November. Confirm year, exact time/timezone, required video duration, eligibility and sponsor criteria in the application platform before submission.

Existing projects can participate if the submitted work is new within the six-week window. Open source is encouraged, but judges must be able to verify the work. Suggested track: Consumer Products & Payments. Its official description emphasizes instant, programmable payment rails and a usable first experience.

## Copy-ready project text

**Name:** DevClans TradeGuard

**Pitch:** TradeGuard turns trade agreements into reviewed terms, delivery evidence and accountable escrow settlement. Singapore Qwen suggests structured terms for human approval. Buyers and suppliers commit to the same agreement, and a named arbitrator resolves delivery disputes. Monad testnet contracts enforce wallet roles, hold no-value TGT and let each participant withdraw their allocation independently.

**Problem:** Written agreements, delivery receipts and payment decisions often become disconnected when a shipment is incomplete. TradeGuard ties reviewed terms to evidence, a dispute reason and a settlement record.

**Demo:** Kano Foods orders 100 bags of maize from Savannah Grains. The invoice is NGN 4,200,000, while the separate demonstration settlement is 2,500 TGT. A declaration records 90 bags. The buyer disputes the shortage, an arbitrator allocates 2,250 TGT to the supplier and 250 TGT to the buyer, and both withdraw.

**Monad integration:** Deployed Solidity escrow; immutable token choice and terms commitments; wallet-enforced buyer/supplier/arbitrator roles; exact funding; dispute and mutual settlement; pull withdrawals. Documents stay off-chain. Sandbox records and testnet trades are separate.

**AI integration:** Singapore Qwen Plus suggests structured fields. The adapter requests JSON, validates and normalizes fields and checks source quotes. Humans compare all fields before approving. AI does not arbitrate or sign.

**Limits:** Prototype, not audited. No-value TGT only. Evidence does not prove physical delivery. Deadlines are advisory, and unavailable arbitration plus refusal of mutual settlement can lock funds indefinitely.

## Links and evidence

- Code: https://github.com/Alhibb/TradeGuard
- App: https://devclans-tradeguard.alhibb.chatgpt.site/ — owner-only; judge access must be arranged.
- TGT: https://testnet.monadscan.com/address/0xfcc80262fccc19b3a833e2453e52316a0edf5f3b
- Escrow: https://testnet.monadscan.com/address/0x27ba251f396277a9af8ca7cf2cde4a279582f83a
- Screenshots: [gallery in README](../README.md#screenshots)
- Checks: [VERIFICATION.md](VERIFICATION.md)
- Narration: [DEMO_NARRATION.md](DEMO_NARRATION.md)

Do not supply invented transaction hashes, video links or submission confirmation IDs. The deployed escrow's read-only check returned next trade ID 1 on 2026-10-02: a live three-wallet trade has not yet been created.

## Submission steps

1. Open the official platform and review rules. Complete team, contact and project fields personally; choose the closest track.
2. Explain the new build-window work and link supporting commits. Distinguish pre-existing code from eligible work.
3. Set hosted Qwen through secure secret entry, set hosted token/escrow/RPC/chain values and apply the environment through deployment.
4. Choose judge access explicitly: invite judge accounts or approve public Site access. Verify from an intended judge account before using the app link.
5. Run the sandbox story using New trade → Use sample text → Extract terms. Show the provider label and source review, approvals, evidence download, 90/10 decision and both withdrawals. Refresh and export.
6. Run the separate Monad story with distinct buyer, supplier and arbitrator wallets. Record successful receipts for create, acceptance, allowance, funding, delivery commitment, dispute, resolution and withdrawals. See README for the exact wallet runbook.
7. Record and upload the demo in the platform's required format/length. Keep keys, recovery phrases and private runtime settings out of captures.
8. Paste the write-up, code/app/video links and requested chain proof. Review sponsor-specific claims and required fields.
9. Submit before the exact cutoff, then save the public project-profile URL and submission confirmation. No entry has been submitted by this preparation.

## Suggested three-minute recording

- 0:00–0:20: problem and 100/90-bag story.
- 0:20–0:55: real Qwen extraction, reviewed fields and separate invoice/TGT amounts.
- 0:55–1:40: sandbox approvals, evidence shortage, dispute and 90/10 resolution.
- 1:40–2:35: deployed Monad contract and successful settlement/withdrawal receipts. Record only after the live rehearsal.
- 2:35–3:00: result, practical limits and links.

Three minutes is a proposed narration target, not a verified platform requirement. Screenshots do not substitute for a video or successful wallet receipts.
