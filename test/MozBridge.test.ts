// import { expect } from "chai"
// import { ethers } from "hardhat"
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { getAddr, deployNew } from "../scripts/util/helper";
// import { setup } from "../scripts/util/setup";
// import { TYPE_REQUEST_SNAPSHOT, TYPE_REPORT_SNAPSHOT, TYPE_REQUEST_SETTLE, TYPE_REPORT_SETTLE, TYPE_STAKE_ASSETS, TYPE_UNSTAKE_ASSETS } from "../scripts/util/constants"; 

// describe("MozBridge Test",  () => {
//     let owner: SignerWithAddress, alice: any, badUser1: any, fakeContract: any;
//     let mozBridge: any;
//     let lzEndpoint: any;
//     let chainId : number;
//     let nonce : number;
//     let defaultGasAmount : number;
//     let transferAndCallPayload: any, defaultCreditObj: any, defaulSwapObject: any, defaultLzTxObj: any;
//     let endpoints: any;

//     before(async () => {
//         chainId = 1;
//         nonce = 1;
//         ({ owner, alice, badUser1, fakeContract } = await getAddr(ethers));
//         endpoints = await setup(3, 2);
//         mozBridge =  endpoints[chainId].mozBridge;
//         lzEndpoint = endpoints[chainId].lzEndpoint;
//         defaultGasAmount = 50;
//         transferAndCallPayload = "0x"
//         defaultCreditObj = { credits: 0, idealBalance: 0 }
//         defaulSwapObject = { amount: 0, eqFee: 0, eqReward: 0, lpFee: 0, protocolFee: 0, lkbRemove: 0 }
//         defaultLzTxObj = { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x" }
//     })

//     it("lzReceive() - reverts for non LZ endpoint", async function () {
//         await expect(mozBridge.connect(fakeContract).lzReceive(chainId, alice.address, nonce, alice.address)).to.be.revertedWith(
//             "MozBridge: only LayerZero endpoint can call lzReceive"
//         )
//     })

//     it("setBridge() - reverts for zero chain ID.", async function () {
//         let _chainId = 0;
//         await expect(mozBridge.setBridge(_chainId, fakeContract.address)).to.be.revertedWith("MozBridge: Set bridge error")
//     })    
//     it("setBridge() - reverts for non owner", async function () {
//         await expect(mozBridge.connect(fakeContract).setBridge(chainId, fakeContract.address)).to.be.revertedWith("Ownable: caller is not the owner");
//     })

//     it("setGasAmount()", async function () {
//         await expect(mozBridge.setGasAmount(chainId, TYPE_REPORT_SNAPSHOT, defaultGasAmount)).to.not.be.revertedWith("MozBridge: invalid _functionType")
//         expect(await mozBridge.gasLookup(chainId, TYPE_REPORT_SNAPSHOT)).to.equal(defaultGasAmount)
//     })

//     it("setGasAmount() - reverts for non owner", async function () {
//         await expect(mozBridge.connect(badUser1).setGasAmount(chainId, TYPE_REPORT_SNAPSHOT, defaultGasAmount)).to.be.revertedWith(
//             "Ownable: caller is not the owner"
//         )
//     })
    
//     it("setGasAmount() - reverts for invalid function type", async function () {
//         const invalidFunctionType = 0
//         await expect(mozBridge.setGasAmount(chainId, invalidFunctionType, defaultGasAmount)).to.be.revertedWith("MozBridge: invalid _functionType")
//     })

//     it("quoteLayerZeroFee() - TYPE_REQUEST_SNAPSHOT returns valid fee", async function () {
//         expect(
//             await mozBridge.quoteLayerZeroFee(
//                 chainId, 
//                 TYPE_REQUEST_SNAPSHOT, 
//                 {
//                     dstGasForCall: 0,
//                     dstNativeAmount: 0,
//                     dstNativeAddr: "0x",
//                 },
//                 transferAndCallPayload
//             )
//         ).to.deep.equal(await lzEndpoint.estimateFees(chainId, fakeContract.address, transferAndCallPayload, false, "0x"))
//     })

//     it("quoteLayerZeroFee() - TYPE_REPORT_SNAPSHOT returns valid fee", async function () {
//         expect(
//             await mozBridge.quoteLayerZeroFee(
//                 chainId, 
//                 TYPE_REPORT_SNAPSHOT, 
//                 {
//                     dstGasForCall: 0,
//                     dstNativeAmount: 0,
//                     dstNativeAddr: "0x",
//                 },
//                 transferAndCallPayload
//             )
//         ).to.deep.equal(await lzEndpoint.estimateFees(chainId, fakeContract.address, transferAndCallPayload, false, "0x"))
//     })

//     it("quoteLayerZeroFee() - TYPE_REQUEST_SETTLE returns valid fee", async function () {
//         expect(
//             await mozBridge.quoteLayerZeroFee(
//                 chainId, 
//                 TYPE_REQUEST_SETTLE, 
//                 {
//                     dstGasForCall: 0,
//                     dstNativeAmount: 0,
//                     dstNativeAddr: "0x",
//                 },
//                 transferAndCallPayload
//             )
//         ).to.deep.equal(await lzEndpoint.estimateFees(chainId, fakeContract.address, transferAndCallPayload, false, "0x"))
//     })

//     it("quoteLayerZeroFee() - TYPE_REPORT_SETTLE returns valid fee", async function () {
//         expect(
//             await mozBridge.quoteLayerZeroFee(
//                 chainId, 
//                 TYPE_REPORT_SETTLE, 
//                 {
//                     dstGasForCall: 0,
//                     dstNativeAmount: 0,
//                     dstNativeAddr: "0x",
//                 },
//                 transferAndCallPayload
//             )
//         ).to.deep.equal(await lzEndpoint.estimateFees(chainId, fakeContract.address, transferAndCallPayload, false, "0x"))
//     })
    
//     it("quoteLayerZeroFee() - reverts with unsupported tx type is sent", async function () {
//         await expect(
//             mozBridge.quoteLayerZeroFee(
//                 chainId, 
//                 TYPE_UNSTAKE_ASSETS + 1,
//                 {
//                     dstGasForCall: 0,
//                     dstNativeAmount: 0,
//                     dstNativeAddr: "0x",
//                 },
//                 transferAndCallPayload
//                 )
//         ).to.revertedWith("MozBridge: unsupported function type")
//     })


//     it("setSendVersion()", async function () {
//         const version = 22
//         await mozBridge.setSendVersion(version)
//         expect(await lzEndpoint.mockSendVersion()).to.equal(version)
//     })

//     it("setReceiveVersion()", async function () {
//         const version = 23
//         await mozBridge.setReceiveVersion(version)
//         expect(await lzEndpoint.mockReceiveVersion()).to.equal(version)
//     })

//     it("setSendVersion() - reverts when non owner", async function () {
//         const version = 22
//         await expect(mozBridge.connect(badUser1).setSendVersion(version)).to.revertedWith("Ownable: caller is not the owner")
//     })

//     it("setReceiveVersion() - reverts when non owner", async function () {
//         const version = 23
//         await expect(mozBridge.connect(badUser1).setReceiveVersion(version)).to.revertedWith("Ownable: caller is not the owner")
//     })

//     it("setConfig()", async function () {
//         const version = 22
//         const configType = 0
//         const config = "0x1234"
//         await expect(mozBridge.setConfig(version, chainId, configType, config))
//             .to.emit(lzEndpoint, "SetConfig")
//             .withArgs(version, chainId, configType, config)
//     })

//     it("setConfig() - reverts when non owner", async function () {
//         const version = 22
//         const configType = 0
//         const config = "0x1234"
//         await expect(mozBridge.connect(badUser1).setConfig(version, chainId, configType, config)).to.revertedWith(
//             "Ownable: caller is not the owner"
//         )
//     })

//     it("forceResumeReceive()", async function () {
//         const bytesAddr = "0x1234"
//         await expect(mozBridge.forceResumeReceive(chainId, bytesAddr)).to.emit(lzEndpoint, "ForceResumeReceive").withArgs(chainId, bytesAddr)
//     })

//     it("forceResumeReceive() - reverts when non owner", async function () {
//         const bytesAddr = "0x1234"
//         await expect(mozBridge.connect(badUser1).forceResumeReceive(chainId, bytesAddr)).to.revertedWith("Ownable: caller is not the owner")
//     })
// })