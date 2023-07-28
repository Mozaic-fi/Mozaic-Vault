import { deployNew, getCurrentBlock, getAddr } from "./helper";
import { CHAIN_ID_TO_NAME, POOL_ID_TO_NAME } from "./constants";
import { Contract } from "ethers"
import { ethers } from "hardhat"

interface Endpoint {
  chainId: number;
  name: string;
  pools: Record<number, Pool>;
}

interface Pool {
    id: number;
    chainId: number;
    name: string;
    ld: number;
    sd: number;
    dstChainWeights: Record<number, Record<number, number>>;
    token?: Contract; // Replace `Contract` with the actual token contract type
    pool?: Contract; // Replace `Contract` with the actual pool contract type
    chainPaths?: {
        [chainId: number]: {
          [tokenId: number]: boolean;
        };
    };
    lzEndpoint?: Contract;
    router?: Contract;
    bridge?: Contract;
}

interface DeployedEndpoint extends Endpoint {
    factory: Contract;
    router: Contract;
    bridge: Contract;
    lzEndpoint: Contract;
    feeLibrary: Contract;
    lpStaking: Contract;
    stargateToken: Contract;
    mozVault?: Contract;
    mozBridge?: Contract;
    mozController?: Contract;
    stargatePlugin: Contract;
    mozLP: Contract;
}

export const setup = async (numOfChains: number, numOfTokens: number, random = false): Promise<Record<number, DeployedEndpoint>> => {
    const config = generateConfig(numOfChains, numOfTokens, random);
    // deploy the stargate instances on each "chain"

    const endpoints: Record<number, DeployedEndpoint> = Object.fromEntries(
    await Promise.all(Object.values(config).map(async (endpoint) => [endpoint.chainId, await deployStargateEndpointAndMozEndpoint(endpoint, numOfChains)])));
    await bridgeEndpoints(endpoints);
    await deployPoolsOnChains(endpoints);
    await createChainPaths(endpoints);
    await activateChainPaths(endpoints);
    await updateLPStaking(endpoints);
    await setDeltaParam(endpoints);
    await setGasAmount(endpoints);
    await addTokenVaults(endpoints);
    await setVaultsLookup(endpoints);
    return endpoints;
};

const generateConfig = (numOfChains: number, numOfTokens: number, random: boolean): Record<number, Endpoint> => {
  const endpoints: Record<number, Endpoint> = {};
  const lds: Record<number, number[]> = {};

  for (let chainId = 1; chainId <= numOfChains; chainId++) {
    const config: Endpoint = { chainId, name: CHAIN_ID_TO_NAME[chainId], pools: {} };

    for (let tokenId = 11; tokenId <= numOfTokens * 11; tokenId += 11) {
      const ld = random ? Math.floor(Math.random() * 18) : 18;

      if (lds[tokenId]) {
        lds[tokenId].push(ld);
      } else {
        lds[tokenId] = [ld];
      }

      const pool: Pool = { id: tokenId, chainId, name: POOL_ID_TO_NAME[tokenId], ld, dstChainWeights: {}, sd: 0 };

      for (let dstChainId = 1; dstChainId <= numOfChains; dstChainId++) {
        if (dstChainId !== chainId) {
          pool.dstChainWeights[dstChainId] = {};
          for (let dstTokenId = 11; dstTokenId <= numOfTokens * 11; dstTokenId += 11) {
            pool.dstChainWeights[dstChainId][dstTokenId] = random ? Math.floor(Math.random() * 99) + 1 : 1;
          }
        }
      }
      config.pools[tokenId] = pool;
    }
    endpoints[chainId] = config;
  }
  let lds1: Record<number, number> = {}
  for (const [_tokenId, _lds] of Object.entries(lds)) {
    const tokenId = parseInt(_tokenId, 10);
    lds1[tokenId] = Math.min(..._lds);
  }

  for (let endpoint of Object.values(endpoints)) {
    for (let pool of Object.values(endpoint.pools)) {
      pool["sd"] = lds1[pool.id];
    }
  }
  
  return endpoints;
};

const deployStargateEndpointAndMozEndpoint = async (endpoint: Endpoint, numOfChains: number): Promise<DeployedEndpoint> => {
  //---------------------StargateEndpoint---------------------
  const [owner] = await ethers.getSigners();
  const lzEndpoint = await deployNew("LZEndpointMock", [endpoint.chainId]);
  const router = await deployNew("Router");
  const bridge = await deployNew("Bridge", [lzEndpoint.address, router.address]);
  const factory = await deployNew("Factory", [router.address]);
  const feeLibrary = await deployNew("StargateFeeLibraryV02", [factory.address]);
  const stargateToken = await deployNew("StargateToken", ["StargateToken", "STG", lzEndpoint.address, endpoint.chainId, ethers.utils.parseEther("1000000000")])
  let startBlock = (await getCurrentBlock()) + 6
  const lpStaking = await deployNew("LPStaking", [stargateToken.address, "30000000000000", startBlock, 1000000000]);
  // set deploy params
  await factory.setDefaultFeeLibrary(feeLibrary.address);
  await router.setBridgeAndFactory(bridge.address, factory.address);

  //-----------------------MozEndPoint--------------------------
  
  // Deployment
  const mozBridge = await deployNew("MozBridge", [lzEndpoint.address, 1])

  let mozController: Contract;
  let mozVault: Contract;
  let mozLP: Contract;
  mozLP = await deployNew("MozaicLP", [lzEndpoint.address, 6])
  mozVault = await deployNew("Vault",[endpoint.chainId]);
  await mozVault.setBridge(mozBridge.address);
  await mozVault.setMozaicLP(mozLP.address);
  mozLP.setVault(mozVault.address);

  mozController = await deployNew("Controller", [1]);
  await mozController.setBridge(mozBridge.address);

  await mozController.setTreasury(owner.address);

  for (let chainId = 2; chainId <= numOfChains; chainId++) {
    mozController.setChainId(chainId);
  }
  await mozBridge.setController(mozController.address);
  await mozBridge.setVault(mozVault.address);

  // setBridgeLookup
  const stargatePlugin = await deployNew("StargatePlugin", [mozVault.address]);
  await configPlugin(stargatePlugin, router, lpStaking, stargateToken);

  await mozVault.addPlugin(1, stargatePlugin.address, stargateToken.address);
  return { factory, router, bridge, lzEndpoint, feeLibrary, lpStaking, stargateToken, mozVault, mozBridge, mozController, stargatePlugin, mozLP, ...endpoint };
}


const bridgeEndpoints = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const src of Object.values(endpoints)) {
      for (const dst of Object.values(endpoints)) {
        await src.bridge.setBridge(dst.chainId, dst.bridge.address);
        await src.mozBridge?.setBridge(dst.chainId, dst.mozBridge?.address);
        await src.lzEndpoint.setDestLzEndpoint(dst.bridge.address, dst.lzEndpoint.address);
        await src.lzEndpoint.setDestLzEndpoint(dst.mozBridge?.address, dst.lzEndpoint.address);
      }
    }
}

const deployPoolsOnChains = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      endpoint.pools = Object.fromEntries(
        await Promise.all(
          Object.values(endpoint.pools).map(async (pool) => {
            const poolObj: Pool = {
              ...pool,
              lzEndpoint: endpoint.lzEndpoint,
              router: endpoint.router,
              bridge: endpoint.bridge,
              dstChainWeights: pool.dstChainWeights,
              ...(await deployPool(endpoint, pool.name, pool.ld, pool.sd, pool.id)),
            };
  
            return [pool.id, poolObj];
          })
        )
      );
    }
}
  
export const deployPool = async (
    sgEndpoint: DeployedEndpoint,
    name: string,
    ld: number,
    sd: number,
    id: number
  ) => {
    const tokenName = `${name}-${sgEndpoint.name}`;
    const token = await deployNew("MockToken", [tokenName, tokenName, ld]);
    await sgEndpoint.router.createPool(id, token.address, sd, ld, "x", "x*");
    const poolAddress = await sgEndpoint.factory.getPool(id);
    const Pool = await ethers.getContractFactory("Pool");
    let pool = await Pool.attach(poolAddress);
  
    return { token, pool, name: tokenName, id, ld, sd, chainPaths: {} };
}

const createChainPaths = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      for (const pool of Object.values(endpoint.pools)) {
        pool.chainPaths = {};
        for (const [chainId, pathWeights] of Object.entries(pool.dstChainWeights) as any) {
          pool.chainPaths[chainId] = {};
          for (const [tokenId, weight] of Object.entries(pathWeights) as any) {
            await endpoint.router.createChainPath(pool.id, Number(chainId), Number(tokenId), weight);
            
            pool.chainPaths[chainId][tokenId] = false;
          }
        }
      }
    }
  }
  
const activateChainPaths = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      for (const pool of Object.values(endpoint.pools) as any) {
        for (const [chainId, chainPaths] of Object.entries(pool.chainPaths) as any) {
          for (const tokenId of Object.keys(chainPaths)) {
            await endpoint.router.activateChainPath(pool.id, Number(chainId), Number(tokenId));
            pool.chainPaths[chainId][tokenId] = true;
          }
        }
      }
    }
  }
  
  const updateLPStaking = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      for (const pool of Object.values(endpoint.pools) as any) {
        await endpoint.lpStaking.add(10, pool.pool.address);
      }
    }
  }
  const setDeltaParam = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      for (const pool of Object.values(endpoint.pools) as any) {
        await endpoint.router.setDeltaParam(pool.id, true, 6000, 6000, true, true);
      }
    }
  }

  const setGasAmount = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint1 of Object.values(endpoints)) {
      for (const endpoint2 of Object.values(endpoints)) {
        if(endpoint1 != endpoint2) {
          const _gasAmount = 500000;
          for(let _functionType = 1; _functionType <= 4; _functionType++) {
            await endpoint1.bridge.setGasAmount(endpoint2.chainId, _functionType, _gasAmount);  
          }
          for(let _functionType = 1; _functionType <= 4; _functionType++) {
            await endpoint1.mozBridge?.setGasAmount(endpoint2.chainId, _functionType, _gasAmount);
            
          }
        }
      }
    }
  }
  const setVaultsLookup = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for (const endpoint1 of Object.values(endpoints)) {
      for (const endpoint2 of Object.values(endpoints)) {
        if(endpoint1 != endpoint2) {
          await endpoint1.stargatePlugin.setVaultsLookup(endpoint2.chainId, endpoint2.mozVault?.address);
        }
      }
    }
  }

  const configPlugin = async (_stargatePlugin: Contract, _stgRouter: Contract, _stgLPStaking: Contract, _stargateToken: Contract) => {
    _stargatePlugin.configPlugin(_stgRouter.address, _stgLPStaking.address, _stargateToken.address);
    _stargatePlugin.setFee(1500, 9500);
    let fakeTreasury: any, fakeInsurance: any;
    ({ fakeTreasury, fakeInsurance } = await getAddr(ethers));
    _stargatePlugin.setTreasury(fakeTreasury.address, fakeInsurance.address);
  }

  export const equalize = async (endpoints: Record<number, DeployedEndpoint>,  user = { address: "0x0" }): Promise<void> => {
    for (const endpoint of Object.values(endpoints)) {
      for (const pool of Object.values(endpoint.pools) as any) {
          for (const [dstChainId, chainPaths] of Object.entries(pool.chainPaths) as any) {
              for (const dstPoolId of Object.keys(chainPaths)) {
                await endpoint.router.sendCredits(dstChainId, pool.id, dstPoolId, user.address)
              }
          }
      }
    }
  }
  const addTokenVaults = async (endpoints: Record<number, DeployedEndpoint>): Promise<void> => {
    for(const endpoint of Object.values(endpoints)) {
      for(const pool of Object.values(endpoint.pools)) {
        await endpoint.mozVault?.addToken(pool.token?.address);
      }
    }
  }
