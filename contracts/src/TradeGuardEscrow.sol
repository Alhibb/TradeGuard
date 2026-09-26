// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/// @notice Single-token, non-upgradeable trade escrow. Testnet prototype, not audited.
/// @dev Both parties approve immutable terms. Arbitrator is explicitly trusted.
contract TradeGuardEscrow is ReentrancyGuard,Pausable,Ownable {
 using SafeERC20 for IERC20;
 enum State { None, Proposed, Accepted, Funded, Delivered, Disputed, Settled }
 struct Trade {address buyer;address seller;address arbitrator;uint256 amount;bytes32 termsHash;uint64 deliveryDeadline;uint32 reviewSeconds;uint64 deliveredAt;uint64 disputedAt;State state;bytes32 evidenceHash;}
 struct Proposal {uint256 sellerAmount;bool buyerApproved;bool sellerApproved;}
 IERC20 public immutable token;
 uint256 public nextId=1;
 uint256 public liabilities;
 uint256 public creditsTotal;
 mapping(uint256=>Trade) public trades;
 mapping(address=>uint256) public credits;
 mapping(uint256=>Proposal) public proposals;
 uint256 public constant ARBITRATION_TARGET=7 days;
 event Created(uint256 indexed id,address indexed buyer,address indexed seller,bytes32 termsHash,uint256 amount);
 event Accepted(uint256 indexed id);
 event Funded(uint256 indexed id,uint256 amount);
 event Delivery(uint256 indexed id,bytes32 evidenceHash);
 event Disputed(uint256 indexed id,bytes32 reasonHash);
 event Settled(uint256 indexed id,uint256 sellerAmount,uint256 buyerAmount,bytes32 reasonHash);
 event Withdrawn(address indexed recipient,uint256 amount);
 event MutualProposed(uint256 indexed id,uint256 sellerAmount,address indexed proposer);
 error Unauthorized();error WrongState();error InvalidTerms();error TransferMismatch();error NoCredit();
 constructor(IERC20 token_,address guardian) Ownable(guardian){if(address(token_).code.length==0)revert InvalidTerms();token=token_;}
 /// @notice Buyer creates and accepts terms; supplier must accept on-chain before funding.
 function create(address seller,address arbitrator,uint256 amount,bytes32 termsHash,uint64 deliveryDeadline,uint32 reviewSeconds) external whenNotPaused returns(uint256 id){
  if(seller==address(0)||arbitrator==address(0)||seller==msg.sender||arbitrator==msg.sender||arbitrator==seller||amount==0||termsHash==bytes32(0)||deliveryDeadline<=block.timestamp||reviewSeconds<1 hours||reviewSeconds>30 days)revert InvalidTerms();
  id=nextId++;trades[id]=Trade(msg.sender,seller,arbitrator,amount,termsHash,deliveryDeadline,reviewSeconds,0,0,State.Proposed,bytes32(0));emit Created(id,msg.sender,seller,termsHash,amount);
 }
 function accept(uint256 id) external whenNotPaused {Trade storage t=trades[id];if(msg.sender!=t.seller)revert Unauthorized();if(t.state!=State.Proposed)revert WrongState();t.state=State.Accepted;emit Accepted(id);}
 function fund(uint256 id) external whenNotPaused nonReentrant {Trade storage t=trades[id];if(msg.sender!=t.buyer)revert Unauthorized();if(t.state!=State.Accepted||block.timestamp>=t.deliveryDeadline)revert WrongState();t.state=State.Funded;liabilities+=t.amount;uint256 beforeBalance=token.balanceOf(address(this));token.safeTransferFrom(msg.sender,address(this),t.amount);if(token.balanceOf(address(this))-beforeBalance!=t.amount)revert TransferMismatch();emit Funded(id,t.amount);}
 function submitDelivery(uint256 id,bytes32 evidenceHash) external whenNotPaused {Trade storage t=trades[id];if(msg.sender!=t.seller)revert Unauthorized();if(t.state!=State.Funded)revert WrongState();if(evidenceHash==bytes32(0))revert InvalidTerms();t.state=State.Delivered;t.evidenceHash=evidenceHash;t.deliveredAt=uint64(block.timestamp);emit Delivery(id,evidenceHash);}
 function approveDelivery(uint256 id) external whenNotPaused {Trade storage t=trades[id];if(msg.sender!=t.buyer)revert Unauthorized();if(t.state!=State.Delivered)revert WrongState();_settle(id,t.amount,bytes32(0));}
 /// @notice Parties can dispute active trades even while creation/ordinary settlement is paused.
 function dispute(uint256 id,bytes32 reasonHash) external {Trade storage t=trades[id];if(msg.sender!=t.buyer&&msg.sender!=t.seller)revert Unauthorized();if(t.state!=State.Funded&&t.state!=State.Delivered)revert WrongState();if(reasonHash==bytes32(0))revert InvalidTerms();delete proposals[id];t.state=State.Disputed;t.disputedAt=uint64(block.timestamp);emit Disputed(id,reasonHash);}
 /// @notice No timeout automatically assigns funds. The seven-day arbitration target is informational.
 function resolve(uint256 id,uint256 sellerAmount,bytes32 reasonHash) external {Trade storage t=trades[id];if(msg.sender!=t.arbitrator)revert Unauthorized();if(t.state!=State.Disputed)revert WrongState();if(reasonHash==bytes32(0))revert InvalidTerms();_settle(id,sellerAmount,reasonHash);}
 /// @notice A party proposes a split; the other must approve that exact split. Works without arbitrator.
 function proposeMutual(uint256 id,uint256 sellerAmount) external {Trade storage t=trades[id];if(msg.sender!=t.buyer&&msg.sender!=t.seller)revert Unauthorized();if(t.state!=State.Funded&&t.state!=State.Delivered&&t.state!=State.Disputed)revert WrongState();if(sellerAmount>t.amount)revert InvalidTerms();proposals[id]=Proposal(sellerAmount,msg.sender==t.buyer,msg.sender==t.seller);emit MutualProposed(id,sellerAmount,msg.sender);}
 function approveMutual(uint256 id,uint256 expectedSellerAmount) external {Trade storage t=trades[id];if(msg.sender!=t.buyer&&msg.sender!=t.seller)revert Unauthorized();if(t.state!=State.Funded&&t.state!=State.Delivered&&t.state!=State.Disputed)revert WrongState();Proposal storage p=proposals[id];if((!p.buyerApproved&&!p.sellerApproved)||p.sellerAmount!=expectedSellerAmount)revert InvalidTerms();if(msg.sender==t.buyer)p.buyerApproved=true;else p.sellerApproved=true;if(p.buyerApproved&&p.sellerApproved)_settle(id,p.sellerAmount,keccak256('MUTUAL_SETTLEMENT'));}
 function _settle(uint256 id,uint256 sellerAmount,bytes32 reasonHash) internal {Trade storage t=trades[id];if(sellerAmount>t.amount)revert InvalidTerms();t.state=State.Settled;liabilities-=t.amount;credits[t.seller]+=sellerAmount;credits[t.buyer]+=t.amount-sellerAmount;creditsTotal+=t.amount;delete proposals[id];emit Settled(id,sellerAmount,t.amount-sellerAmount,reasonHash);}
 /// @notice Withdrawals remain enabled during pause. Only caller's own allocation can be withdrawn.
 function withdraw() external nonReentrant {uint256 amount=credits[msg.sender];if(amount==0)revert NoCredit();credits[msg.sender]=0;creditsTotal-=amount;token.safeTransfer(msg.sender,amount);emit Withdrawn(msg.sender,amount);}
 function renounceOwnership() public override onlyOwner {revert Unauthorized();}
 function pause() external onlyOwner {_pause();}
 function unpause() external onlyOwner {_unpause();}
}
