# Mozaic Hercules Vault v1 aka Stablecoin

## Running Tests

```
yarn install
yarn test
```

# Scope

| Contract                     | SLOC | Purpose                                                                                                                                                | Libraries used                                                                                                                                                                                                                       |
| ---------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| contracts/Controller.sol     | 243  | The Mozaic Controller performs Mozaic operations to UpdateAssetState and Settle.                                                                       | [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/SafeERC20.sol) [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) |
| contracts/MozBridge.sol      | 262  | The MozBridge facilitates communication between the Controller and Vaults by employing the LayerZero Protocol.                                         | [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) []()                                                                                                                      |
| contracts/Vault.sol          | 413  | The Vault Contract is responsible for handling deposit and withdrawal requests and interacting with both plugins and the controller.                   |                                                                                                                                                                                                                                      |
| contracts/StargatePlugin.sol | 281  | Core trading logic for stake, unstake of Stargate pools                                                                                                |                                                                                                                                                                                                                                      |
| contracts/MozaicLP.sol       | 28   | The Liquity Provider token contract of Mozaic is a crucial component within the ecosystem, playing a pivotal role in facilitating liquidity provision. |                                                                                                                                                                                                                                      |
| Total SLOC                   | 1227 |                                                                                                                                                        |                                                                                                                                                                                                                                      |

## Out of scope

- libraries/stargate/Bridge.sol
- libraries/stargate/Factory.sol
- libraries/stargate/LPStaking.sol
- libraries/stargate/Pool.sol
- libraries/stargate/Router.sol
- libraries/stargate/StargateToken.sol
- libraries/testMock/LZEndpointMock.sol
