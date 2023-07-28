// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

interface IController{

    struct Snapshot {
        uint256 depositRequestAmount;
        uint256 withdrawRequestAmountMLP;
        uint256 totalStablecoin;
        uint256 totalMozaicLp; // Mozaic "LP"
        uint256[] amounts;
    }
    
    function updateSnapshot(uint8 _srcChainId, address _srcVaultAddr, Snapshot memory _snapshot) external;
}