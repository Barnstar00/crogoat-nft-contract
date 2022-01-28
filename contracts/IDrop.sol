// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDrop {
    function mintCost(address _minter) external view returns(uint256);
    function canMint(address _minter) external view returns (uint256);
    function mint(uint256 _amount) external payable;
    function maxSupply() external view returns (uint256);
}