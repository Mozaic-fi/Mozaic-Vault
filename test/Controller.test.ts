// import { expect } from "chai"
// import { ethers, network } from "hardhat"
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { getAddr, deployNew, getCurrentBlock } from "../scripts/util/helper"
// import { setup, equalize } from "../scripts/util/setup"
// import { Contract, BigNumber } from "ethers";
// import { DAI, USDC, USDT, BUSD, TETHER, ActionType, ProtocolStatus, ZERO_ADDRESS} from "../scripts/util/constants"
// import exp = require("constants");
// describe("Controller Test", async () => {
//     let owner: SignerWithAddress, alice: any, bob: any, user3: any, master: any, badUser1: any, fakeContract : any;
//     let endpoints: any;
//     let mozController: Contract;
//     const getToken = async (chainId: number, tokenId: number): Promise<Contract> => {
//         return endpoints[chainId]['pools'][tokenId]['token'];
//     }
//     const getVault = async (chainId: number): Promise<Contract> => {
//         return endpoints[chainId].mozVault;
//     }
//     const getMozLP = async (chainId: number): Promise<Contract> => {
//         return endpoints[chainId].mozLP;
//     }
    
//     before(async () => {
//         ({ owner, alice, bob, user3, master, badUser1, fakeContract } = await getAddr(ethers));
//         const mainChainId = 1;
//         const numOfChains = 3;
//         const numOfTokens = 3;
//         endpoints = await setup(numOfChains, numOfTokens);
//         mozController = endpoints[mainChainId].mozController;
//         await mozController.connect(owner).setMaster(master.address);
        
//         const amount = ethers.utils.parseEther('1'); // 1 Ether
//         await owner.sendTransaction({
//             to: mozController.address,
//             value: amount,
//         });
//         for(let chainid = 1; chainid <= numOfChains; chainid++) {
//             let vault = await getVault(chainid);
//             await owner.sendTransaction({
//                 to: vault.address,
//                 value: amount,
//             });
//         }
//         await ethers.provider.getBalance(mozController.address);
//     })
    
//     describe("Set Bridge", async () => {
//         it("setBridge() - reverts for non owner", async () => {
//             await expect(mozController.connect(badUser1).setBridge(fakeContract.address)).to.be.revertedWith(
//                 "Ownable: caller is not the owner"
//             );
//         })   
//         it("setBridge() - reverts for ZERO_ADDRESS", async () => {
//             await expect(mozController.setBridge(ZERO_ADDRESS)).to.be.revertedWith(
//                 "Controller: Invalid address"
//             );
//         })
//         it("setBridge() - reverts if it exists", async () => {
//             await expect(mozController.setBridge(fakeContract.address)).to.be.revertedWith(
//                 "Controller: The bridge has been already set."
//             );
//         }) 
//     })
//     describe("Set Treasury", async () => {
//         it("setTreasury() - reverts for non owner", async () => {
//             await expect(mozController.connect(badUser1).setTreasury(fakeContract.address)).to.be.revertedWith(
//                 "Ownable: caller is not the owner"
//             );
//         })   
//         it("setTreasury() - reverts for ZERO_ADDRESS", async () => {
//             await expect(mozController.setTreasury(ZERO_ADDRESS)).to.be.revertedWith(
//                 "Controller: Invalid address"
//             );
//         })
//         it("setTreasury() - reverts if it exists", async () => {
//             await expect(mozController.setTreasury(fakeContract.address)).to.be.revertedWith(
//                 "Controller: The treasury has already been set"
//             );
//         }) 
//     })
    
//     describe("Set Master", async () => {
//         it("setMaster() - reverts for non owner", async () => {
//             await expect(mozController.connect(badUser1).setMaster(fakeContract.address)).to.be.revertedWith(
//                 "Ownable: caller is not the owner"
//             );
//         })
//         it("setMaster() - reverts for ZERO_ADDRESS", async () => {
//             await expect(mozController.setMaster(ZERO_ADDRESS)).to.be.revertedWith(
//                 "Controller: Invalid address"
//             );
//         })
//     })

//     describe("Set and Remove chainId", async () => {
//         it("setChainId()", async () => {
//             let chainId = 4;
//             expect(await mozController.isAcceptingChainId(chainId)).to.be.equal(false);
//             await mozController.setChainId(chainId);
//             expect(await mozController.isAcceptingChainId(chainId)).to.be.equal(true);
//         })
//         it("setChainId() - reverts for non owner", async () => {
//             let chainId = 2;
//             await expect(mozController.connect(badUser1).setChainId(chainId)).to.be.revertedWith(
//                 "Ownable: caller is not the owner"
//             );
//         })   
//         it("setChainId() - reverts for zero chain id", async () => {
//             await expect(mozController.setChainId(0)).to.be.revertedWith(
//                 "Controller: Invalid chainID"
//             );
//         })
//         it("setChainId() - reverts when chain id already exist", async () => {
//             await expect(mozController.setChainId(2)).to.be.revertedWith(
//                 "Controller: chainId alreay exist"
//             );
//         })
//         it("removeChainId()", async () => {
//             let chainId = 4;
//             expect(await mozController.isAcceptingChainId(chainId)).to.be.equal(true);
//             await mozController.removeChainId(chainId);
//             expect(await mozController.isAcceptingChainId(chainId)).to.be.equal(false);
//         })
//         it("removeChainId() - reverts for non owner", async () => {
//             let chainId = 2;
//             await expect(mozController.connect(badUser1).removeChainId(chainId)).to.be.revertedWith(
//                 "Ownable: caller is not the owner"
//             );
//         })
//         it("removeChainId() - reverts for zero chain id", async () => {
//             let chainId = 0;
//             await expect(mozController.removeChainId(chainId)).to.be.revertedWith(
//                 "Controller: Invalid chainID"
//             );
//         })
//         it("removeChainId() - reverts when chain id doesn't exist", async () => {
//             let chainId = 5;
//             await expect(mozController.removeChainId(chainId)).to.be.revertedWith(
//                 "Controller: chainId doesn't exist"
//             );
//         })
//     }) 
//     describe("Can updateAssetState and settleAllVaults", async () => {
//         let chainId = 2;
//         it("Snapshot and settle deposit and withdraw request", async () => {
//             const usdcToken = await getToken(chainId, USDC);
//             const usdtToken = await getToken(chainId, USDT);
//             const mozVault = await getVault(chainId);
//             const mozLP = await getMozLP(chainId);

//             usdcToken.mint(alice.address, BigNumber.from("1000000000000000000000")); //mint 1000 usdc
//             usdtToken.mint(bob.address, BigNumber.from("100000000000000000000")); //mint 100 usdt
//             // Add deposit request to vault 
//             await usdcToken.connect(alice).approve(mozVault.address, BigNumber.from("1000000000000000000000"));  // deposit 1000 usdc
//             await usdtToken.connect(bob).approve(mozVault.address, BigNumber.from("100000000000000000000"));  // deposit 100 usdt
            
//             await mozVault.connect(alice).addDepositRequest(BigNumber.from("1000000000000000000000"), usdcToken.address, alice.address);
//             await mozVault.connect(bob).addDepositRequest(BigNumber.from("100000000000000000000"), usdtToken.address, bob.address);

//             expect(await mozLP.balanceOf(alice.address)).to.equal(BigNumber.from("1000000000"));
//             expect(await mozLP.balanceOf(bob.address)).to.equal(BigNumber.from("100000000"));

//             await mozLP.connect(alice).approve(mozVault.address, BigNumber.from("500000000"));
//             await mozVault.connect(alice).addWithdrawRequest(BigNumber.from("400000000"), usdcToken.address);
//             await mozVault.connect(alice).addWithdrawRequest(BigNumber.from("100000000"), usdtToken.address);
//             expect(await usdcToken.balanceOf(alice.address)).to.equal(BigNumber.from("400000000000000000000"));
//             expect(await usdtToken.balanceOf(alice.address)).to.equal(BigNumber.from("100000000000000000000"));
//             expect(await mozLP.balanceOf(alice.address)).to.equal(BigNumber.from("500000000"));
            
//             // Get snapshot from the vaults
//             await mozController.connect(master).updateAssetState();
//             expect(await mozController.protocolStatus()).to.equal(ProtocolStatus.OPTIMIZING);
//             expect((await mozController.snapshotReported(chainId)).totalStablecoin).to.equal(BigNumber.from("600000000"));
//             expect((await mozController.snapshotReported(chainId)).totalMozaicLp).to.equal(BigNumber.from("600000000"));
//             expect(await mozController.totalCoinMD()).to.equal(BigNumber.from("600000000"));
//             expect(await mozController.totalMLP()).to.equal(BigNumber.from("600000000"));

//             // Settle all requests
//             await mozController.connect(master).settleAllVaults();
//             expect(await mozController.protocolStatus()).to.equal(ProtocolStatus.IDLE);
//         })
//         it("revert for not enough token", async () => {
//             const usdcToken = await getToken(chainId, USDC);
//             const usdtToken = await getToken(chainId, USDT);
//             const mozVault = await getVault(chainId);
//             const mozLP = await getMozLP(chainId);
//             await mozLP.connect(alice).approve(mozVault.address, BigNumber.from("100000000"));
//             await expect(
//                 mozVault.connect(alice).addWithdrawRequest(BigNumber.from("100000000"), usdtToken.address)
//             ).to.be.revertedWith("Vault: Not Enough Token.");
//         })
//         it("Couldn't settle before optimizing", async () => {
//             await expect(mozController.connect(master).
//                 settleAllVaults()
//             ).to.be.revertedWith("Controller: Protocal must be OPTIMIZING");
//         })
//         it("Couldn't settle before IDLE", async () => {
//             await mozController.connect(master).updateAssetState();
//             await expect(mozController.connect(master).
//                 updateAssetState()
//             ).to.be.revertedWith("Controller: Protocal must be IDLE");
//             await mozController.connect(master).settleAllVaults();
//         })
//         it("updateAssetState revert for invalid caller", async () => {
//             await expect(mozController.connect(alice).
//                 updateAssetState()
//             ).to.be.revertedWith("Controller: Invalid caller");
//         });
//         it("settleAllVaults revert for invalid caller", async () => {
//             await expect(mozController.connect(alice).
//                 settleAllVaults()
//             ).to.be.revertedWith("Controller: Invalid caller");
//         })
//         it("requestSnapshot revert for invalid caller", async () => {
//             await expect(mozController.connect(alice).
//                 requestSnapshot(chainId)
//             ).to.be.revertedWith("Controller: Invalid caller");
//         });
//         it("requestSettle revert for invalid caller", async () => {
//             await expect(mozController.connect(alice).
//                 requestSettle(chainId)
//             ).to.be.revertedWith("Controller: Invalid caller");
//         })
//     })
//     describe("Can get the status of the Contract", async () => {
//         it("should return correct snapshot data for a supported chain", async () => {
//             // Assuming supportedChainIds contains at least one valid chain ID
//             const supportedChainId = await mozController.supportedChainIds(0);

//             const snapshotData = await mozController.getSnapshotData(supportedChainId);
//             // Assert that the returned snapshot data is not empty or null, you can add more specific assertions if needed.
//             expect(snapshotData).to.not.be.undefined;
//         })
//         it("should return true for a supported chain", async function () {
//             // Assuming supportedChainIds contains at least one valid chain ID
//             const supportedChainId = await mozController.supportedChainIds(0);
//             const isSupported = await mozController.isAcceptingChainId(supportedChainId);
        
//             expect(isSupported).to.be.true;
//         });
    
//         it("should return false for an unsupported chain", async function () {
//             // Assuming unsupportedChainId does not exist in supportedChainIds array
//             const unsupportedChainId = 10;
//             const isSupported = await mozController.isAcceptingChainId(unsupportedChainId);
        
//             expect(isSupported).to.be.false;
//         });
    
//         it("should return true if snapshot is reported for a valid chain", async function () {
//             // Assuming supportedChainIds contains at least one valid chain ID
//             const supportedChainId = await mozController.supportedChainIds(0);

//             // Call the isSnapshotReported function
//             const isReported = await mozController.isSnapshotReported(supportedChainId);
        
//             // Assert that the result is true since we assume that snapshots have been reported
//             expect(isReported).to.be.true;
//         });    
//     })
// })