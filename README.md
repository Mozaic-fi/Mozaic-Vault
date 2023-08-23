# Mozaic Vault
# Overview
AI-Optimized Yield and Liquidity Strategies | Powered by LayerZero
# About Mozaic

Simply put, Mozaic provides automatic yield farming using AI and LayerZero technology.
But it's much more than that. 
Mozaic is a community founded project, bootstrapped by a small team with the goal of bringing AI into the hands of everyday users.

# Developer guide

## Running Tests

```
yarn test
```

# Scope

| Contract | SLOC | Purpose | Libraries used |  
| ----------- | ----------- | ----------- | ----------- |
| contracts/Controller.sol | 243 | The Mozaic Controller performs Mozaic operations to UpdateAssetState and Settle. | [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/SafeERC20.sol) [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol)|
| contracts/MozBridge.sol | 262 | The MozBridge facilitates communication between the Controller and Vaults by employing the LayerZero Protocol. | [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) []() |
| contracts/Vault.sol | 413 | The Vault Contract is responsible for handling deposit and withdrawal requests and interacting with both plugins and the controller. | |
| contracts/StargatePlugin.sol | 281 | Core trading logic for stake, unstake of Stargate pools | |
| contracts/MozaicLP.sol | 28 | The Liquity Provider token contract of Mozaic is a crucial component within the ecosystem, playing a pivotal role in facilitating liquidity provision. | |
| Total SLOC | 1227 |  |  |

## Out of scope

- libraries/stargate/Bridge.sol
- libraries/stargate/Factory.sol
- libraries/stargate/LPStaking.sol
- libraries/stargate/Pool.sol
- libraries/stargate/Router.sol
- libraries/stargate/StargateToken.sol
- libraries/testMock/LZEndpointMock.sol


# Additional Context

## Archimedes
- Mozaic's AI is dubbed Archimedes. 
  He is designed to remove the indecisions that arise in yield farming that stem from yield decay, transaction fees, over choice and the risks that are incurred from moving positions from farm to farm that occasionally involve cross-chain transactions. 

- How does it work?
  When a user deposits into one of the Mozaic vaults, Archimedes:
  Rebalances the deposit across vault assets so it can then...
  Allocate those assets to the farms that will net the highest APY before...
  Compounding - if it is most efficient to relocate to a new farm that hour.