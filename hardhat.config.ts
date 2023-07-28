import {config as dotEnvConfig} from 'dotenv';

dotEnvConfig();

import type {HardhatUserConfig} from 'hardhat/types';

import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-solhint';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-contract-sizer';
import "hardhat-change-network";
import "hardhat-gas-reporter"

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCANAPIKEY;
const ARBITRUM_API_KEY = process.env.ARBITRUM_API_KEY;
const OPTIMISM_API_KEY = process.env.OPTIMISM_API_KEY;
const AVALANCHE_API_KEY = process.env.AVALANCHE_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const Alice = process.env.Alice;
const Jack = process.env.Jack;

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    contractSizer: {
        alphaSort: false,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    solidity: {
        compilers: [{
            version: '0.8.9', 
            settings: {
                optimizer: {
                    enabled:true, 
                    runs:1000
                }
            }
        }],
        settings: {
            debug: {
                // Enable the debugger
                enabled: true,
                // Define the URL of the debugging server
                server: "http://127.0.0.1:8545",
                // Enable Solidity stack traces
                stacktrace: true,
                // Enable detailed errors
                verbose: true,
            },
        },
    },
    // redirect typechain output for the frontend
    typechain: {
        outDir: './types/typechain',
    },
    networks: {
        hardhat: {
            gas: 30000000, //"auto", // 30000000
            gasPrice: "auto",// 8000000000
            accounts: {
                accountsBalance: "10000000000000000000000", // 10,000 ETH
            }
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            gas: 30000000, //"auto", // 30000000
            gasPrice: 20000000000,
        },
        // testnet
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
            accounts: [PRIVATE_KEY!]
        },
        mumbai: {
            url: "https://rpc-mumbai.maticvigil.com",
            accounts: [PRIVATE_KEY!, Alice!],
        },
        fuji: {
            url: `https://rpc.ankr.com/avalanche_fuji`,
            accounts: [PRIVATE_KEY!, Alice!],
          },
        fantom: {
            url: `https://rpc.testnet.fantom.network`,
            accounts: [PRIVATE_KEY!, Alice!],
        },
        arbitrum: {
            url: "https://goerli-rollup.arbitrum.io/rpc",
            // chainId: 42161,
            accounts: [PRIVATE_KEY!, Alice!],
        },
        bnbtest: {
            // url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            url: "https://bsc-testnet.publicnode.com",
            accounts: [PRIVATE_KEY!, Alice!],
        },
        optimism: {
            // url: "https://endpoints.omniatech.io/v1/op/goerli/public",
            url: `https://goerli.optimism.io`,
            accounts: [PRIVATE_KEY!, Alice!],
            gasPrice: 200000000000,
          },
        /// main net 
        arb: {
            url: "https://arbitrum.meowrpc.com",
            accounts: [PRIVATE_KEY!, Alice!, Jack!],
        },
        pol: {
            url: "https://polygon-bor.publicnode.com",
            accounts: [PRIVATE_KEY!, Alice!, Jack!],
            gasPrice: 200000000000,
        },
        ava: {
            url: "https://avalanche-c-chain.publicnode.com",
            accounts: [PRIVATE_KEY!, Alice!],
        },
        opt: {
            url: "https://optimism.meowrpc.com",
            accounts: [PRIVATE_KEY!, Alice!],
        },
        bnb: {
            url: "https://bsc.publicnode.com",
            accounts: [PRIVATE_KEY!, Alice!],
        },
    },
    etherscan: {
        apiKey: {
            bscTestnet: BSCSCAN_API_KEY!,
            polygonMumbai: POLYGON_API_KEY!,
            arbitrumGoerli: ARBITRUM_API_KEY!,
            optimisticGoerli: OPTIMISM_API_KEY!,
            avalancheFujiTestnet: AVALANCHE_API_KEY!,
            arbitrumOne: ARBITRUM_API_KEY!,
            polygon: POLYGON_API_KEY!,
            avalanche: AVALANCHE_API_KEY!,
            optimisticEthereum: OPTIMISM_API_KEY!,
            bsc: BSCSCAN_API_KEY!,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 40000000000000
    },
};

export default config;
