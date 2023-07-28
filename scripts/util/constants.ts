const TYPE_REQUEST_SNAPSHOT = 1;
const TYPE_REPORT_SNAPSHOT  = 2;
const TYPE_REQUEST_SETTLE   = 3;
const TYPE_REPORT_SETTLE    = 4;
const TYPE_STAKE_ASSETS     = 5;
const TYPE_UNSTAKE_ASSETS   = 6;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const DEBUG = false // Flag this if you want to print verbose

// chain ids
const ETHEREUM = 1, AVAX = 2, POLYGON = 3, BSC = 4, OPTIMISM = 5, ARBITRUM = 6, FANTOM = 7
const CHAIN_ID_TO_NAME: {[key:number]: string} = {
    [ETHEREUM]: "Eth",
    [AVAX]: "Avax",
    [POLYGON]: "Polygon",
    [BSC]: "Binance",
    [OPTIMISM]: "Optimism",
    [ARBITRUM]: "Arbitrum",
    [FANTOM]: "Fantom",
}
// pool/token ids
const DAI = 11, USDC = 22, USDT = 33, BUSD = 44, TETHER = 55
const POOL_ID_TO_NAME: {[key:number]: string} = {
    [USDC]: "usdc",
    [USDT]: "usdt",
    [DAI]: "dai",
    [BUSD]: "busd ",
    [TETHER]: "tether",
}

const CHAINS = [ETHEREUM, BSC, AVAX, POLYGON, OPTIMISM, ARBITRUM, FANTOM]
const TOKENS = [USDC, USDT, DAI, BUSD, TETHER]

enum ActionType {
// data types
    Stake,
    Unstake,
    GetTotalAssetsMD,
    ClaimReward,
    SwapRemote
}
enum ProtocolStatus {
    IDLE,
    SNAPSHOTTING,
    OPTIMIZING,
    SETTLING
}
const TREASURY_ACTION_TYPE = {
    "TYPE_WITHDRAW": 1,
    "TYPE_ADD_OWNER": 2,
    "TYPE_DEL_OWNER": 3,
    "TYPE_SUPPORT_TOKEN": 4,
    "TYPE_DEL_PROPOSAL": 5,
    "TYPE_UPDATE_REQUIRED_NUM": 6,
    "TYPE_INVALID": 7,
}

const TestNet: {[key: string]: any} = {
    Mumbai: {
        Router:  "0x817436a076060D158204d955E5403b6Ed0A5fac0",
        Bridge:  "0x629B57D89b1739eE1C0c0fD9eab426306e11cF42",
        Factory: "0x43c3a5348671D868ED9dD9BFDb2859bE984d262e",
        LzEndpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
        chainId: 10109,
        Tokens: {
            USDC: "0x742DfA5Aa70a8212857966D491D67B09Ce7D6ec7",
            USDT: "0x6Fc340be8e378c2fF56476409eF48dA9a3B781a0",
        }
    },
    Fuji: {
        Router:  "0x13093E05Eb890dfA6DacecBdE51d24DabAb2Faa1",
        Bridge:  "0x29fBC4E4092Db862218c62a888a00F9521619230",
        Factory: "0x439C197429036423d42631181afAC655b19972e5",
        LzEndpoint: "0x93f54D755A063cE7bB9e6Ac47Eccc8e33411d706",
        chainId: 10106,
        Tokens: {
            USDC: "0x4A0D1092E9df255cf95D72834Ea9255132782318",
            USDT: "0x134Dc38AE8C853D1aa2103d5047591acDAA16682",
        }
    },
    Arbitrum: {
        Router:  "0xb850873f4c993Ac2405A1AdD71F6ca5D4d4d6b4f",
        Bridge:  "0xd43cbCC7642C1Df8e986255228174C2cca58d65b",
        Factory: "0x1dAC955a58f292b8d95c6EBc79d14D3E618971b2",
        LzEndpoint: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab",
        chainId: 10143,
        Tokens: {
            USDC: "0x6aAd876244E7A1Ad44Ec4824Ce813729E5B6C291",
            USDT: "0x533046F316590C19d99c74eE661c6d541b64471C",
        }
    },
    Optimism: {
        Router:  "0x95461eF0e0ecabC049a5c4a6B98Ca7B335FAF068",
        Bridge:  "0x5A7465e1a68F430E7A696aDBC5C107528C1cC9d0",
        Factory: "0x53dD7cEf1eA4eF1b6D1cC83b9F28B6AF8DFb423f",
        LzEndpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
        chainId: 10132,
        Tokens: {
            USDC: "0x0CEDBAF2D0bFF895C861c5422544090EEdC653Bf",
        }
    },
    Bnb: {
        Router:  "0xbB0f1be1E9CE9cB27EA5b0c3a85B7cc3381d8176",
        Bridge:  "0xa1E105511416aEc3200CcE7069548cF332c6DCA2",
        Factory: "0x407210a67cDAe7Aa09E4426109329cd3E90aFe47",
        LzEndpoint: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
        chainId: 10102,
        Tokens: {
            BUSD: "0x1010Bb1b9Dff29e6233E7947e045e0ba58f6E92e",
            USDT: "0xF49E250aEB5abDf660d643583AdFd0be41464EfD",
        }
    }
}


const MainNet: {[key: string]: any} = {
    ARB: {
        Router:  "0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614",
        LPStaking: "0xeA8DfEE1898a7e0a59f7527F076106d7e44c2176",
        StargateToken: "0x6694340fc020c5E6B96567843da2df01b2CE1eb6",
        LzEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 110,
        Tokens: {
            USDC: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
            USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            FRAX: "0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
        }
    },
    POL: {
        Router:  "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd",
        LPStaking: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
        StargateToken: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
        LzEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 109,
        Tokens: {
            USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
            USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        }
    },
    AVA: {
        Router:  "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd",
        LPStaking: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
        StargateToken: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
        LzEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 106,
        Tokens: {
            USDC: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
            USDT: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
            FRAX: "0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64",
        }
    },
    OPT: {
        Router:  "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b",
        LPStaking: "0x4DeA9e918c6289a52cd469cAC652727B7b412Cd2",
        StargateToken: "0x296F55F8Fb28E498B858d0BcDA06D955B2Cb3f97",
        LzEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 111,
        Tokens: {
            USDC: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
            DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
            FRAX: "0x2e3d870790dc77a83dd1d18184acc7439a53f475",
        }
    },
    BNB: {
        Router:  "0x4a364f8c717cAAD9A442737Eb7b8A55cc6cf18D8",
        LPStaking: "0x3052A0F6ab15b4AE1df39962d5DdEFacA86DaB47",
        StargateToken: "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b",
        LzEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 102,
        Tokens: {
            USDT: "0x55d398326f99059ff775485246999027b3197955",
        }
    }
}

export {
    TYPE_REQUEST_SNAPSHOT,
    TYPE_REPORT_SNAPSHOT,
    TYPE_REQUEST_SETTLE,
    TYPE_REPORT_SETTLE,
    TYPE_STAKE_ASSETS,
    TYPE_UNSTAKE_ASSETS,
    ZERO_ADDRESS,
    TREASURY_ACTION_TYPE,
    DEBUG,
    ETHEREUM,
    BSC,
    AVAX,
    POLYGON,
    OPTIMISM,
    ARBITRUM,
    FANTOM,
    CHAIN_ID_TO_NAME,
    USDC,
    DAI,
    USDT,
    BUSD,
    TETHER,
    POOL_ID_TO_NAME,
    CHAINS,
    TOKENS,
    ActionType,
    ProtocolStatus,
    TestNet,
    MainNet,
}
