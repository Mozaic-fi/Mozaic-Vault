import { expect } from "chai"
import { ethers } from "hardhat"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { getAddr, deployNew, getCurrentBlock } from "../scripts/util/helper"
import { setup, equalize } from "../scripts/util/setup"
import { DAI, USDC, USDT, BUSD, TETHER, ActionType,  ZERO_ADDRESS} from "../scripts/util/constants"
import { BigNumber } from "ethers";
describe("Vault Test", async () => {
    let owner: SignerWithAddress, alice: any, bob: any, user3: any, user4: any, fakeBridge: any, master: any, token1: any, fakeContract: any;
    let endpoints : any;
    let mozVault: any;
    let mozLP: any;
    let stargatePlugin: any;
    let chainId = 1;
    let busdToken : any;
    let usdcToken: any, usdtToken: any;
    before(async () => {
        ({ owner, alice, bob, user3, user4, fakeBridge, master, token1, fakeContract} = await getAddr(ethers));
        const numOfChains = 3;
        const numOfTokens = 3;
        endpoints = await setup(numOfChains, numOfTokens);
        mozVault = endpoints[chainId].mozVault;
        stargatePlugin = endpoints[chainId].stargatePlugin;
        mozLP = endpoints[chainId].mozLP;
        mozVault.setBridge(fakeBridge.address);
        busdToken = await deployNew("MockToken", ["busd-ether", "busd-ether", 18]);
        mozVault.setMaster(master.address);
        usdcToken = endpoints[chainId]['pools'][USDC]['token'];
        usdtToken = endpoints[chainId]['pools'][USDT]['token'];
        const amount = ethers.utils.parseEther('1'); // 1 Ether
        for(let id = 1; id <= numOfChains; id++) {
            await owner.sendTransaction({
                to: endpoints[id].mozVault.address,
                value: amount,
            });
        };
    })
    describe("Deposit and withdraw requests", async () => {
        it("should add deposit request", async () => {
            const amount1 = BigNumber.from("100000000000000000000"); // 100 USDC
            const amount2 = BigNumber.from("200000000000000000000"); // 200 USDT
        
            // Mint USDC to Alice
            await usdcToken.mint(alice.address, amount1);
            expect(await usdcToken.balanceOf(alice.address)).to.equal(amount1);
        
            // Mint USDT to Bob
            await usdtToken.mint(bob.address, amount2);
            expect(await usdtToken.balanceOf(bob.address)).to.equal(amount2);
        
            // Add deposit request to the vault for USDC
            usdcToken.connect(alice).approve(mozVault.address, amount1);
            await mozVault.connect(alice).addDepositRequest(amount1, usdcToken.address, alice.address);
            expect(await usdcToken.balanceOf(alice.address)).to.equal(0);
        
            // Add deposit request to the vault for USDT
            usdtToken.connect(bob).approve(mozVault.address, amount2);
            await mozVault.connect(bob).addDepositRequest(amount2, usdtToken.address, bob.address);
            expect(await usdtToken.balanceOf(bob.address)).to.equal(0);
        
            let depositAmountMD = await mozVault.convertLDtoMD(usdcToken.address, amount1);
            let mlpBalanceExpected = await mozVault.amountMDtoMLP(depositAmountMD);
            let lpBalance = await mozLP.balanceOf(alice.address);
            expect(lpBalance).to.equal(mlpBalanceExpected);
        
            depositAmountMD = await mozVault.convertLDtoMD(usdtToken.address, amount2);
            mlpBalanceExpected = await mozVault.amountMDtoMLP(depositAmountMD);
            lpBalance = await mozLP.balanceOf(bob.address);
            expect(lpBalance).to.equal(mlpBalanceExpected);
        });
        
        it("should add withdraw request", async () => {
            const amount1 = BigNumber.from("50000000"); // 50 USDC
            const amount2 = BigNumber.from("100000000"); // 100 USDT
        
            let balanceBefore = await usdcToken.balanceOf(alice.address);
        
            await mozLP.connect(alice).approve(mozVault.address, amount1);
            await mozVault.connect(alice).addWithdrawRequest(amount1, usdcToken.address);
        
            let balanceAfter = await usdcToken.balanceOf(alice.address);
        
            let expectedMD = await mozVault.amountMLPtoMD(amount1);
            let expected = await mozVault.convertMDtoLD(usdcToken.address, expectedMD);
            expect(balanceAfter.sub(balanceBefore)).to.be.equal(expected);
        
            balanceBefore = await usdtToken.balanceOf(bob.address);        
            // Add 2 withdraw requests
            await mozLP.connect(bob).approve(mozVault.address, amount1);
            await mozVault.connect(bob).addWithdrawRequest(amount1, usdtToken.address);
        
            await mozLP.connect(bob).approve(mozVault.address, amount1);
            await mozVault.connect(bob).addWithdrawRequest(amount1, usdtToken.address);
        
            balanceAfter = await usdtToken.balanceOf(bob.address);
        
            expectedMD = await mozVault.amountMLPtoMD(amount2);
            expected = await mozVault.convertMDtoLD(usdtToken.address, expectedMD);
            expect(balanceAfter.sub(balanceBefore)).to.be.equal(expected);
        });
        it("should revert with high deposit amount", async () => {
            const amount = BigNumber.from("5000000000");
            const token = endpoints[chainId]['pools'][USDC]['token'];
            await expect(
                mozVault.connect(alice).addDepositRequest(
                    amount, 
                    token.address,
                    alice.address
                )
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });
        
        it("should revert with high withdraw amount", async () => {
            const amount = BigNumber.from("5000000000");
            const token = endpoints[chainId]['pools'][USDC]['token'];
            await expect(
                mozVault.connect(alice).addWithdrawRequest(
                    amount, 
                    token.address
                )
            ).to.be.revertedWith("Vault: Low LP token balance");
        });
        
        it("should revert when vault does not have enough tokens", async () => {
            const amount = BigNumber.from("100000000");
            const token = endpoints[chainId]['pools'][USDT]['token'];
            await expect(
                mozVault.connect(alice).addWithdrawRequest(
                    amount, 
                    token.address
                )
            ).to.be.revertedWith("Vault: Low LP token balance");
        });
        it("revert with zero amount in deposit request", async () => {
            let token = endpoints[chainId]['pools'][USDC]['token'];
            await expect(
                mozVault.connect(alice).addDepositRequest(
                    0, 
                    token.address,
                    alice.address,
                )
            ).to.be.revertedWith("Vault: Invalid amount");
        })
        it("revert with zero amount in withdraw request", async () => {
            let token = endpoints[chainId]['pools'][USDC]['token'];
            await expect(
                mozVault.connect(alice).addWithdrawRequest(
                    0, 
                    token.address,
                )
            ).to.be.revertedWith("Vault: Invalid amount");
        })
        it("revert with invalid token in deposit request", async () => {
            await expect(
                mozVault.connect(alice).addDepositRequest(
                    BigNumber.from("10000"), 
                    busdToken.address,
                    alice.address,
                )
            ).to.be.revertedWith("Vault: Invalid token");
        })
        it("revert with invalid token in withdraw request", async () => {
            await expect(
                mozVault.connect(alice).addWithdrawRequest(
                    BigNumber.from("10000"), 
                    busdToken.address,
                )
            ).to.be.revertedWith("Vault: Invalid token");
        }) 
    });
    describe("Staking and Unstaking", async () => {
        it("Can stake USDC", async () => {
            // stake 30 USDC
            const amount1 = BigNumber.from("30000000000000000000");
            await mozVault.setMaster(master.address);
            const payload1 = ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [amount1, usdcToken.address]);
            await mozVault.connect(master).execute(1, ActionType.Stake, payload1);
            expect(await mozVault.getStakedAmountPerToken(usdcToken.address)).to.equal(BigNumber.from("30000000000000000000"));
        
            // stake 20 USDC
            const amount2 = BigNumber.from("20000000000000000000");
            const payload2 = ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [amount2, usdcToken.address]);
            await mozVault.connect(master).execute(1, ActionType.Stake, payload2);
            expect(await mozVault.getStakedAmountPerToken(usdcToken.address)).to.equal(BigNumber.from("50000000000000000000"));
        });
        
        it("Can unstake USDC", async () => {
            const amount1 = BigNumber.from("20000000"); // 20 USDC

            await mozVault.setMaster(master.address);
            const amountBefore = await usdcToken.balanceOf(mozVault.address);
            expect(await mozVault.getStakedAmountPerToken(usdcToken.address)).to.equal(BigNumber.from("50000000000000000000"));
        
            // Unstake 10 USDC
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [BigNumber.from("10000000000000000000"), usdcToken.address]);
            await mozVault.connect(master).execute(1, ActionType.Unstake, payload);

            const amountAfter = await usdcToken.balanceOf(mozVault.address);
            const balanceBefore = await usdcToken.balanceOf(bob.address);        
            // Add withdraw requests
            await mozLP.connect(bob).approve(mozVault.address, amount1);
            await mozVault.connect(bob).addWithdrawRequest(amount1, usdcToken.address);
            const balanceAfter = await usdcToken.balanceOf(bob.address);
            expect(balanceAfter.sub( balanceBefore)).to.equal("20000000000000000000");
            expect(amountAfter.sub(amountBefore)).to.equal(BigNumber.from("10000000000000000000"));
            expect(await mozVault.getStakedAmountPerToken(usdcToken.address)).to.equal("30000000000000000000");
        });

        it("Can SwapRemote", async () => {
            const srcChainId = 1, dstChainId = 2;
            const srcToken = endpoints[srcChainId]['pools'][DAI]['token'];
            const dstToken = endpoints[dstChainId]['pools'][DAI]['token'];
            const srcRouter = endpoints[srcChainId].router;
            const dstRouter = endpoints[dstChainId].router;
            const srcPoolId = endpoints[srcChainId]['pools'][DAI]['id'];
            const dstPoolId = endpoints[dstChainId]['pools'][DAI]['id'];
            const srcPool = endpoints[srcChainId]['pools'][DAI]['pool'];
            const dstPool = endpoints[dstChainId]['pools'][DAI]['pool'];
            const srcMozVault = endpoints[srcChainId].mozVault;
            const dstMozVault = endpoints[dstChainId].mozVault;


            const srcMintAmt = BigNumber.from("10000000000000000000000");
            await srcToken.mint(alice.address, srcMintAmt);
            await srcToken.connect(alice).approve(srcRouter.address, srcMintAmt);
            await srcRouter.connect(alice).addLiquidity(srcPoolId, srcMintAmt, alice.address);

            const dstMintAmt = BigNumber.from("10000000000000000000000");
            await dstToken.mint(alice.address, dstMintAmt);
            await dstToken.connect(alice).approve(dstRouter.address, dstMintAmt);
            await dstRouter.connect(alice).addLiquidity(dstPoolId, dstMintAmt, alice.address);

            await equalize(endpoints, endpoints[dstChainId].stargatePlugin);

            await dstRouter.callDelta(dstPoolId, srcPool.defaultSwapMode())
            await dstRouter.callDelta(srcPoolId, srcPool.defaultSwapMode())
            await srcRouter.callDelta(dstPoolId, srcPool.defaultSwapMode())
            await srcRouter.callDelta(srcPoolId, srcPool.defaultSwapMode())
            const amount = BigNumber.from("1000000000000000000000");
            await srcToken.mint(mozVault.address, srcMintAmt);
            
            const dstmozVaultBefore = await dstToken.balanceOf(dstMozVault.address);

            const payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address", "uint16", "uint256"], [amount, srcToken.address, dstChainId, dstPoolId]);
            await srcMozVault.connect(master).execute(1, ActionType.SwapRemote, payload);
            
            const dstmozVaultAfter = await dstToken.balanceOf(dstMozVault.address);
            expect(BigInt(dstmozVaultAfter - dstmozVaultBefore)).to.equal(amount);
        })
        it("Can get the staked amount per token", async() => {
            const expectedStakedAmount = "30000000000000000000";
            const usdcTokenAddress = usdcToken.address;
            const actualStakedAmount = await mozVault.getStakedAmountPerToken(usdcTokenAddress);

            expect(actualStakedAmount).to.equal(expectedStakedAmount);
        })
    })
    describe("Add and remove plugins", async () => {
        it("should add plugin to the vault", async () => {
            let pluginId = 2;
            let pluginAddr = user3.address;
            let pluginReward = user4.address;
            await mozVault.addPlugin(pluginId, pluginAddr, pluginReward);
            expect(await mozVault.getPluginAddress(pluginId)).to.be.equal(pluginAddr);
            expect(await mozVault.getPluginReward(pluginId)).to.be.equal(pluginReward);
        })
        it("should remove plugin", async () => {
            let pluginId = 2;
            await mozVault.removePlugin(pluginId);
            expect(await mozVault.getPluginAddress(pluginId)).to.be.equal('0x0000000000000000000000000000000000000000');
            expect(await mozVault.getPluginReward(pluginId)).to.be.equal('0x0000000000000000000000000000000000000000');
        })
        it("remove plugin - will revert with zero id", async () => {
            let pluginId = 0;
            await expect(mozVault.removePlugin(pluginId)).to.be.revertedWith("Vault: Invalid id");
        })
        it("remove plugin will revert when id don't exist", async () => {
            let pluginId = 3;
            await expect(mozVault.removePlugin(pluginId)).to.be.revertedWith("Vault: Plugin id doesn't exist.");
        })
        it("revert for non owner", async () => {
            let pluginId = 3;
            let pluginAddr = endpoints[chainId].stargatePlugin.address;
            let pluginReward = endpoints[chainId].stargateToken.address;
            await expect(mozVault.connect(user3).addPlugin(pluginId, pluginAddr, pluginReward)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        it("should get plugin address by id", async () => {
            // Get a plugin contract address
            const pluginAddress = endpoints[chainId].stargatePlugin.address;
        
            // Check if the plugin address can be retrieved by its id
            expect(await mozVault.getPluginAddress(1)).to.equal(pluginAddress);
        });
        it("should get plugin reward address by id", async () => {
            // Get a plugin contract address
            const rewardAddress = endpoints[chainId].stargateToken.address;
        
            // Check if the plugin reward address can be retrieved by its id
            expect(await mozVault.getPluginReward(1)).to.equal(rewardAddress);
        });
        it("should get the number of plugins", async () => {
            // Initially, there should be one plugins added
            expect(await mozVault.getNumberOfPlugins()).to.equal(1);
        });
    })
    describe("Add and remove token", async () => {
        it("should add token", async () => {
            let tx = mozVault.addToken(busdToken.address);
            await expect(tx).to.emit(mozVault,"AddToken").withArgs(busdToken.address);
        })
        it("should remove token", async () => {
            let tx = mozVault.removeToken(busdToken.address);
            await expect(tx).to.emit(mozVault,"RemoveToken").withArgs(busdToken.address)
        })
        it("reverts for non owner", async () => {
            await expect(mozVault.connect(user3).addToken(busdToken.address)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        it("should add a token and check if it's accepted", async function () {
            await mozVault.addToken(busdToken.address);
            const isAcceptedToken = await mozVault.isAcceptingToken(busdToken.address);
            expect(isAcceptedToken).to.be.true;
        });
        it("should check if a token is accepted", async () => {
            expect(await mozVault.isAcceptingToken(usdcToken.address)).to.be.true;
            expect(await mozVault.isAcceptingToken(usdtToken.address)).to.be.true;
        
            const unknownToken = ethers.utils.getAddress("0x0123456789abcdef0123456789abcdef01234567");
            expect(await mozVault.isAcceptingToken(unknownToken)).to.be.false;
        });
        it("should get the number of accepting tokens", async () => {
            // Initially, there should be 4 tokens added as accepting tokens
            expect(await mozVault.getNumberOfTokens()).to.equal(4);
        
            // Add token3 as an accepting token in the contract
            await mozVault.addToken(token1.address);
        
            // Now, the number of accepting tokens should be 3
            expect(await mozVault.getNumberOfTokens()).to.equal(5);
          });
    })
    describe("Config functions", async () => {
        it("setMaster- reverts for non owner", async () => {
            await expect(mozVault.connect(user3).setMaster(user3.address)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        it("setMaster- reverts for Zero address", async () => {
            await expect(mozVault.connect(owner).setMaster(ZERO_ADDRESS)).to.be.revertedWith("Vault: Invalid address");
        })
        it("setBridge- reverts for non owner", async () => {
            await expect(mozVault.connect(user3).setBridge(user3.address)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        it("setBridge- reverts for Zero address", async () => {
            await expect(mozVault.connect(owner).setBridge(ZERO_ADDRESS)).to.be.revertedWith("Vault: Invalid address");
        })
        it("setBridge - reverts if it exists", async () => {
            await expect(mozVault.setBridge(fakeContract.address)).to.be.revertedWith(
                "Vault: Invalid address"
            );
        }) 
        it("setMozaicLP- reverts for non owner", async () => {
            await expect(mozVault.connect(user3).setMozaicLP(user3.address)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        it("setMozaicLP- reverts for Zero address", async () => {
            await expect(mozVault.connect(owner).setMozaicLP(ZERO_ADDRESS)).to.be.revertedWith("Vault: Invalid address");
        })
        it("setMozaicLP - reverts if it exists", async () => {
            await expect(mozVault.setMozaicLP(fakeContract.address)).to.be.revertedWith(
                "Vault: Invalid address"
            );
        }) 
    })
    describe("Convert functions", async () => {
        it("convertMDtoLD", async () => {
            let token = endpoints[chainId]['pools'][USDC]['token'];
            let amountMD = BigNumber.from("100");
            let amountLD = await mozVault.convertMDtoLD(token.address, amountMD);    
          expect(amountLD).to.equal(BigNumber.from("100000000000000"));
        })
        it("convertLDtoMD", async () => {
            let token = endpoints[chainId]['pools'][USDC]['token'];
            let amountLD = BigNumber.from("100000000000000");
            let amountMD = await mozVault.convertLDtoMD(token.address, amountLD);
            expect(amountMD).to.equal(BigNumber.from("100"));
        })
        it("amountMDtoMLP", async () => {
            // totalCoinMD = 0, totalMLP = 0
            let amountMD = BigNumber.from("100000000000000");
            let amountMLP = await mozVault.amountMDtoMLP(amountMD);
            expect(amountMLP).to.equal(BigNumber.from("100000000000000"));
        })
        it("amountMLPtoMD", async () => {
            // totalCoinMD = 0, totalMLP = 0
            let amountMLP = BigNumber.from("100000000000000");
            let amountMD = await mozVault.amountMDtoMLP(amountMLP);
            expect(amountMD).to.equal(BigNumber.from("100000000000000"));
        }) 
    })
})