import { expect } from "chai"
import { ethers, network } from "hardhat"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { getAddr, deployNew } from "../scripts/util/helper"
import { setup, equalize } from "../scripts/util/setup"
import { BUSD, USDC, DAI, USDT, TETHER, ActionType} from "../scripts/util/constants"
import { Contract, BigNumber } from "ethers";

describe("StargatePlugin test", () => {
    let owner: SignerWithAddress, alice: any, bob: any, user3: any, fakeVault: any, fakeTreasury: any, fakeInsurance: any, badUser1: any;
    let StargatePlugin: any;
    let stgRouter: Contract, stgLPStaking: Contract, stgToken: Contract, mozVault: Contract;
    let usdcContract: any, busdContract: any;
    let endpoints: any;
    before(async () => {
        ({ owner, alice, bob, user3, badUser1, fakeVault, fakeTreasury, fakeInsurance} = await getAddr(ethers));

        // setup endpoints with 2 chainIds and 3 tokens
        endpoints = await setup(3, 3);
        const chainId = 1;
        
        // get StargateRouter and StargateLPStaking from endpoints
        stgRouter = endpoints[chainId].router;
        stgLPStaking = endpoints[chainId].lpStaking;
        stgToken = endpoints[chainId].stargateToken;
        StargatePlugin = await deployNew("StargatePlugin", [fakeVault.address]);
        await StargatePlugin.configPlugin(stgRouter.address, stgLPStaking.address, stgToken.address);
        await StargatePlugin.setFee(1500, 9500);
        await StargatePlugin.setTreasury(fakeTreasury.address, fakeInsurance.address);
        let chainIds: number[] = [];
        let vaultAddrs: any[] = [];
        for(let i = 1; i <= 3; i++) {
            if(i == chainId) continue;
            chainIds.push(endpoints[i].chainId);
            vaultAddrs.push(endpoints[i].mozVault?.address);    
        }
        for(let i = 1; i <= 3; i++) {
            if(i == chainId) continue;
            await StargatePlugin.setVaultsLookup(i, endpoints[i].mozVault.address);
        }
        const amount = ethers.utils.parseEther('1'); // 1 Ether
        await owner.sendTransaction({
            to: endpoints[1].mozVault?.address,
            value: amount,
        });
        // usdc, busd token contract
        usdcContract = endpoints[chainId]['pools'][USDC].token;
        busdContract = await deployNew("MockToken", ["busd-ether", "busd-ether", 18]);
    })
    describe('Config', async () => {
        it('revert with invalid action', async () => {
            const InvalidAction = 6;
            const payload = ethers.utils.defaultAbiCoder.encode(["address"], [ usdcContract.address]);
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    InvalidAction, 
                    payload
                    )
            ).revertedWithoutReason();
        })
        it('execute() - revert when the executer is not vault', async () => {
            const payload = ethers.utils.defaultAbiCoder.encode(["address"], [ usdcContract.address]);
            await expect(
                StargatePlugin.connect(badUser1).execute(
                    ActionType.Stake, 
                    payload
                    )
            ).revertedWith("StargatePlugin: caller is not the vault");
        })
    })
    describe('Stake', async () => {
        it('can stake USDC', async () => {
            // mint USDC to fakeVault
            usdcContract.mint(fakeVault.address, BigNumber.from("10000000000000"));
            expect(await usdcContract.balanceOf(fakeVault.address)).to.equal(BigNumber.from("10000000000000"));
            
            // Stake two times and check if the total staked amount matches with the sum of the individual amounts
            let stakeAmount = BigNumber.from("100000000000"); // fakeVault stake the USDC of stakeAmount
            let payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [stakeAmount, usdcContract.address]);
            usdcContract.connect(fakeVault).approve(StargatePlugin.address, BigNumber.from(stakeAmount));
            await StargatePlugin.connect(fakeVault).execute(ActionType.Stake, payload);

            stakeAmount = BigNumber.from("50000000000");
            payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address"], [ stakeAmount, usdcContract.address]);
            usdcContract.connect(fakeVault).approve(StargatePlugin.address, stakeAmount);
            await StargatePlugin.connect(fakeVault).execute(ActionType.Stake, payload);

            // Check LpTokens for owner in LpStaking
            let staked = await stgLPStaking.userInfo(
                BigNumber.from("1"), 
                StargatePlugin.address
            );
            expect(staked.amount).to.equal(BigNumber.from("150000000000"));
        })
        it("should revert stake with invalid token", async () => {
            // mint BUSD to fakeVault
            const amount = BigNumber.from("1000000000");
            busdContract.mint(fakeVault.address, amount);
            expect(await busdContract.balanceOf(fakeVault.address)).to.equal(amount);

            // fakeVault stake the BUSD of amount
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, busdContract.address]);
            busdContract.connect(fakeVault).approve(StargatePlugin.address, BigNumber.from(amount));
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.Stake, 
                    payload
                )
            ).to.be.revertedWith("StargatePlugin: Invalid token");
        })
        it("Cannot stake zero amount", async () => {
            const amount = BigNumber.from("0");
            // fakeVault stake zero amount
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, usdcContract.address]);
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.Stake,
                    payload
                )
            ).to.be.revertedWith("StargatePlugin: Cannot stake zero amount");
        })
        it("Can get the Staked amount", async () => {
            const staked = await StargatePlugin.getStakedAmount(usdcContract.address);
            const stakedExpected = BigNumber.from("150000000000");
            expect(staked[0]).to.equal(stakedExpected);
        })
    })
    describe('Unstake', async () => {
        it('can unstake UDSC', async () => {
            // transfer stargate token to lpStaking
            await stgToken.connect(owner).transfer(stgLPStaking.address, 100000);
            
            //// "wait" 1 days...
            await ethers.provider.send("evm_increaseTime", [60]);
            await ethers.provider.send("evm_mine", []);

            // Unstake  and check if the total staked amount decreased and the balance of the vault increased
            const amount = BigNumber.from("500000000");

            const balanceBefore = await usdcContract.balanceOf(fakeVault.address);
            const stakedBefore = await stgLPStaking.userInfo(BigNumber.from("1"), StargatePlugin.address);

            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, usdcContract.address]);
            await StargatePlugin.connect(fakeVault).execute(ActionType.Unstake, payload);

            const stakedAfter = await stgLPStaking.userInfo(BigNumber.from("1"), StargatePlugin.address);
            const balanceAfter = await usdcContract.balanceOf(fakeVault.address);

            expect(balanceAfter - balanceBefore).to.equal(amount);
            expect(stakedBefore.amount - stakedAfter.amount).to.equal(amount);
        })
        it('Can get reward', async () => {
            //// "wait" 1 days...
            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine", []);
            
            const amount = BigNumber.from("500000000");

            const balanceBefore = await usdcContract.balanceOf(fakeVault.address);
            const stakedBefore = await stgLPStaking.userInfo(BigNumber.from("1"), StargatePlugin.address);

            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, usdcContract.address]);
            await StargatePlugin.connect(fakeVault).execute(ActionType.Unstake, payload);

            const stakedAfter = await stgLPStaking.userInfo(BigNumber.from("1"), StargatePlugin.address);
            const balanceAfter = await usdcContract.balanceOf(fakeVault.address);

            expect(balanceAfter - balanceBefore).to.equal(amount);
            expect(stakedBefore.amount - stakedAfter.amount).to.equal(amount);

            // Get and check reward amount of vault, treasury and insurance
            let rewardAmount = await stgToken.balanceOf(fakeVault.address);
            expect(rewardAmount).gt(BigNumber.from(0));

            rewardAmount = await stgToken.balanceOf(fakeTreasury.address);
            expect(rewardAmount).gt(BigNumber.from(0));

            rewardAmount = await stgToken.balanceOf(fakeInsurance.address);
            expect(rewardAmount).gt(BigNumber.from(0));
        })
        it('revert with invalid token', async () => {
            const amount = BigNumber.from("500000000");
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, busdContract.address]);

            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.Unstake,
                    payload
                )
            ).to.be.revertedWith("StargatePlugin: Invalid token");
        })
        it('Cannot unstake zero amount', async () => {
            const amount = BigNumber.from("0");
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256","address"], [amount, usdcContract.address]);
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.Unstake,
                    payload
                )
            ).to.be.revertedWith("StargatePlugin: Cannot unstake zero amount");
        })
    })
    describe('SwapRemote', async () => {
        let srcChainId : any, srcToken : any, srcPoolId : any, srcRouter : any, srcPool : any;
        let dstChainId : any, dstToken : any, dstPoolId : any, dstRouter : any, dstmozVault: any;
        before('',async () => {
            srcChainId = 1;
            dstChainId = 2;
            srcToken = endpoints[srcChainId]['pools'][DAI]['token'];
            srcPoolId = endpoints[srcChainId]['pools'][DAI]['id'];
            srcPool = endpoints[srcChainId]['pools'][DAI]['pool'];
            srcRouter = endpoints[srcChainId].router;

            dstToken = endpoints[dstChainId]['pools'][DAI]['token'];
            dstPoolId = endpoints[dstChainId]['pools'][DAI]['id'];
            dstRouter = endpoints[dstChainId].router;
            dstmozVault = endpoints[dstChainId].mozVault;
        })
        it('can swapRemote', async () => {
            const srcMintAmt = BigNumber.from("1000000000");
            await srcToken.mint(alice.address, srcMintAmt);
            await srcToken.connect(alice).approve(srcRouter.address, srcMintAmt);
            await srcRouter.connect(alice).addLiquidity(srcPoolId, srcMintAmt, alice.address);

            const dstMintAmt = BigNumber.from("1000000000");
            await dstToken.mint(alice.address, dstMintAmt);
            await dstToken.connect(alice).approve(dstRouter.address, dstMintAmt);
            await dstRouter.connect(alice).addLiquidity(dstPoolId, dstMintAmt, alice.address);

            // await srcToken.mint(StargatePlugin.address, srcMintAmt);
            await equalize(endpoints, StargatePlugin);

            await dstRouter.callDelta(dstPoolId, srcPool.defaultSwapMode())
            await dstRouter.callDelta(srcPoolId, srcPool.defaultSwapMode())
            await srcRouter.callDelta(dstPoolId, srcPool.defaultSwapMode())
            await srcRouter.callDelta(srcPoolId, srcPool.defaultSwapMode())
            
            const amount = BigNumber.from("50000000");
            await srcToken.mint(fakeVault.address, srcMintAmt);
            await srcToken.connect(fakeVault).approve(StargatePlugin.address, srcMintAmt);
            
            const dstmozVaultBefore = await dstToken.balanceOf(dstmozVault.address);

            const payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address", "uint16", "uint256"], [amount, srcToken.address, dstChainId, dstPoolId]);
            const fee = await StargatePlugin.quoteSwapFee(dstChainId);            
            await StargatePlugin.connect(fakeVault).execute(ActionType.SwapRemote, payload, {value: fee});
            
            const dstmozVaultAfter = await dstToken.balanceOf(dstmozVault.address);
            expect(dstmozVaultAfter - dstmozVaultBefore).to.equal(amount);
        })
        it('reverts when balance is not high enough for swap', async () => {
            const amount = BigNumber.from("1000000000");
            await srcToken.mint(fakeVault.address, amount);
            await srcToken.connect(fakeVault).approve(StargatePlugin.address, amount);
            const fee = await StargatePlugin.quoteSwapFee(dstChainId);
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address", "uint16", "uint256"], [amount, srcToken.address, dstChainId, dstPoolId]);
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.SwapRemote, 
                    payload,
                    {value: fee}
                )
            ).to.be.revertedWith("Stargate: dst balance too low");
        })
        it('reverts with 0 amount', async () => {
            const amount = BigNumber.from("0");
            await srcToken.mint(fakeVault.address, amount);
            await srcToken.connect(fakeVault).approve(StargatePlugin.address, amount);
            const fee = await StargatePlugin.quoteSwapFee(dstChainId);
            const payload = ethers.utils.defaultAbiCoder.encode(["uint256", "address", "uint16", "uint256"], [amount, srcToken.address, dstChainId, dstPoolId]);
            
            await expect(
                StargatePlugin.connect(fakeVault).execute(
                    ActionType.SwapRemote, 
                    payload,
                    {value: fee}
                )
            ).to.be.revertedWith("Cannot swapRemote zero amount");
        })
    })
    describe('Get total Assets', async () => {
        it('Can get total assets', async () => {
            const array =  [usdcContract.address];
            const payload = ethers.utils.defaultAbiCoder.encode(["address[]"], [array]);
            await StargatePlugin.connect(fakeVault).execute(ActionType.GetTotalAssetsMD, payload);
        })
        it('revert with invalid caller', async () => {
            const array =  [busdContract.address, usdcContract.address];
            const payload = ethers.utils.defaultAbiCoder.encode(["address[]"], [array]);
            await expect(
                StargatePlugin.connect(badUser1).execute(
                    ActionType.GetTotalAssetsMD,
                    payload
                )
            ).to.be.revertedWith("StargatePlugin: caller is not the vault");
        })
    })
})