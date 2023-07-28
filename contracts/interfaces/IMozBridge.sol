// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

interface IMozBridge {
    struct LzTxObj {
        uint256 dstGasForCall;
        uint256 dstNativeAmount;
        bytes dstNativeAddr;
    }

    struct Snapshot {
        uint256 depositRequestAmount;
        uint256 withdrawRequestAmountMLP;
        uint256 totalStablecoin;
        uint256 totalMozaicLp; // Mozaic "LP"
        uint256[] amounts;
    }
}