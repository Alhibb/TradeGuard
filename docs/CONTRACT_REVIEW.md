# TradeGuard independent contract requirement review

Review date: 2026-09-26. Scope: authorization, accounting, terminal settlement, pause, and dispute liveness in `contracts/src/TradeGuardEscrow.sol` and `DemoToken.sol`, compared with sections 6–7 of the supplied TradeGuard research blueprint. This is a bounded static review, not an audit, formal proof, or claim of production readiness. No transactions were executed by this reviewer. Runtime tests produced elsewhere must be reported separately.

Dependencies inspected locally: OpenZeppelin SafeERC20, ReentrancyGuard, Pausable, Ownable, and relevant ERC20 transfer/balance/allowance implementation. Findings assume the immutable settlement token is the supplied, unmodified DemoToken. The constructor accepts any address containing code; that assumption must be enforced by deployment and configuration.

## Result

No concrete unauthorized allocation, cross-order accounting theft, or repeated terminal payment path was identified under the DemoToken assumption. Recovery is not guaranteed: time passage does not allocate funds or replace an unavailable arbitrator. That is an explicit prototype policy, with significant liveness consequences, rather than a hidden automatic refund mechanism.

## Requirement map

| Requirement | Evidence and conclusion |
|---|---|
| Same fixed terms accepted before funding | `create` records buyer, seller, arbitrator, amount, hash and deadlines; `accept` is seller-only; no term mutator exists; `fund` is buyer-only in Accepted. On-chain values are immutable per order. Canonical document hashing and UI agreement identity require separate application review. |
| One settlement token, exact funding | Immutable `token`; transfer balance delta must equal amount. Wrong token cannot be selected per order. Constructor does not enforce a particular bytecode or token registry. |
| Role authorization | Seller submits delivery; buyer approves; either party disputes or negotiates; only the named arbitrator resolves; withdrawal always pays `msg.sender`. Owner can pause but has no direct allocation or escrow rescue authority. Distinct nonzero role addresses are checked at creation. |
| No bypass of dispute by ordinary approval | `approveDelivery` requires Delivered, so Disputed rejects it. Arbitrator resolution and mutually approved allocation are deliberately still available. See stale proposal issue below. |
| Bounded allocation | `_settle` checks sellerAmount <= amount, and allocates the remainder to buyer. There are no external calls during settlement. Every current entry point restricts settlement to a funded active state. |
| No double settlement | First settlement writes Settled. All later settlement, delivery and dispute paths reject that state. Duplicate funding rejects non-Accepted state. |
| Conservation | Funding adds amount to liabilities and exactly that token balance. Settlement subtracts amount from liabilities and adds amount to creditsTotal; buyer/seller credits sum to amount. Withdrawal clears caller credit and subtracts creditsTotal before transfer. With a reverting/false-returning token transfer, SafeERC20 reverts the whole transaction, restoring credit. Unsolicited token transfers create surplus, not accounting credit. |
| Pause | `create`, `accept`, `fund`, `submitDelivery`, `approveDelivery` stop. `dispute`, `resolve`, both mutual settlement methods, and `withdraw` remain enabled. This is a selective pause, not a freeze of every value allocation. |
| Deadlines and arbitration response | Funding rejects an elapsed delivery deadline. Other deadlines do not gate actions: reviewSeconds and deliveredAt are stored; ARBITRATION_TARGET is a constant. Disputes are available immediately in Funded/Delivered. No automatic timer releases funds. |

## Findings and limits

### L1 — Unavailable arbitrator can leave funds locked indefinitely (known policy, material liveness limit)

Reproduction: fund an order, open a dispute, make the arbitrator unavailable and have either counterparty refuse a mutual split. Advancing past `disputedAt + ARBITRATION_TARGET` changes no permissions. Buyer approval remains unavailable and neither party can force a refund or release. Mutual settlement works only if both cooperate.

This follows the source comment that the seven-day target is informational. It is consistent with the blueprint's rejection of unilateral auto-release, but does not solve its explicitly open recovery problem. User-facing terms must state the consequence of missing the target: continued lock until arbitrator action or mutual agreement. Do not claim guaranteed recovery. A production fallback requires a separately agreed trust and dispute policy, not an arbitrary timeout payout added during implementation.

### L2 — Dispute does not invalidate outstanding mutual consent (policy ambiguity; low severity under current semantics)

Reproduction: seller proposes a 100% buyer refund while Funded; seller subsequently submits delivery and/or opens a dispute; buyer calls `approveMutual(id, 0)`. The preexisting seller approval remains valid, so the order settles despite the changed dispute context. The reverse applies to an old buyer proposal accepted by the seller. `dispute` changes state and timestamp but neither clears `proposals[id]` nor advances a consent epoch.

No unauthorized split is created: the proposer explicitly offered that exact amount, and mutual settlement is intentionally allowed in Disputed. However, there is no dedicated cancellation method, and users may reasonably expect opening a dispute to withdraw an earlier offer. Define whether offers survive state transitions. If not, clear proposals on dispute and/or bind approvals to a proposal nonce and relevant state epoch. The current `expectedSellerAmount` correctly prevents substitution of a different numeric split, but is not a general revocation mechanism. A replacement proposal can also race an already-pending approval; transaction ordering remains authoritative.

### L3 — Inherited ownership renunciation can make pause permanent (administrative availability footgun)

`Ownable.renounceOwnership` is inherited without restriction. Owner can pause and then renounce; onlyOwner `unpause` becomes unreachable. Ownership transfer to an unusable nonzero address has a similar result. No caller can thereby take escrow. Already allocated withdrawals and dispute/mutual settlement remain available, so this is not a blanket lock of every asset. Ordinary creation, funding, delivery and approval remain permanently blocked.

For a disposable test deployment this may be tolerable. For a maintained deployment, explicitly prohibit renunciation while paused or remove it, and use an operationally recoverable owner / deliberate ownership transfer procedure.

### L4 — Delivery and review deadlines are mostly advisory (prototype policy requiring accurate presentation)

`submitDelivery` accepts a Funded order after its deliveryDeadline. `approveDelivery` remains possible after reviewSeconds. Parties can dispute even before either deadline. No automatic release occurs, which matches the blueprint. The code therefore implements timestamps useful for escalation context, not enforced delivery acceptance or a bounded buyer review window. UI and terms must not state that these periods expire rights or trigger money movement. Delayed delivery is evidence for the arbitrator, not a contract rejection.

### L5 — Safety conclusions do not extend to arbitrary tokens (deployment trust boundary)

The exact incoming balance check rejects standard fee-on-transfer deposits, but does not establish that arbitrary future outbound transfers pay the recipient in full. A malicious, rebasing, fee-changing, or upgradeable token can undermine balance/entitlement assumptions; SafeERC20 validates call success, not economic correctness. Supplied DemoToken inherits ordinary ERC20 transfers without hooks, fees or rebase, so no concrete issue follows for this deployment. Verify its address and code before publishing deployment configuration. The unrestricted faucet is intentional and makes token amounts economically meaningless; it is not an authorization defect in the demo.

## Verification still needed

Executable contract scenarios should cover both mutual proposal orderings, invalid caller for each restricted action, repeat funding/settlement/withdrawal, allocation bounds, pause permissions including withdrawal, transfer failure restoring credit, and a multi-order accounting invariant. Time advancement should confirm the documented absence of forced recovery. Add a case for a proposal surviving dispute so the policy is intentional and visible. A stateful property suite should maintain deposited = liabilities + creditsTotal + withdrawn, with unsolicited transfers tracked separately, and balance >= liabilities + creditsTotal for the supported token.

Static evidence is strong for straightforward guarded transitions, but does not substitute for runtime tests, deployment verification, independently commissioned security review, or a resolved production liveness policy.

## Implementation follow-up

After the independent static review, the implementing agent cleared `proposals[id]` when opening a dispute and overrode `renounceOwnership` to revert. L2 and the renunciation portion of L3 therefore describe the reviewed earlier snapshot, not the final implementation. Ownership transfer still requires operational care. Five executable local-EVM scenario tests passed, including generated multi-order splits; five domain tests also passed. These bounded checks are not an audit or exhaustive stateful fuzzing.
