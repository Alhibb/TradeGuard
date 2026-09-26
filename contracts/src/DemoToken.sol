// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
/// @notice Unrestricted test faucet, no economic value. Do not use for production settlement.
contract DemoToken is ERC20 {constructor() ERC20('TradeGuard Demo Token','TGT'){}function decimals() public pure override returns(uint8){return 6;}function faucet() external {_mint(msg.sender,10000*10**6);}}
