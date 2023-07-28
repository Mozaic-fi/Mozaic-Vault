import {ethers} from 'hardhat';
import {expect} from 'chai';
import {Contract, utils} from 'ethers';
import {BigNumber} from 'ethers';

export const getAddr = async (ethers: any) => {
  const [owner, master,proxyOwner, bob, alice, user3, user4, badUser1, badUser2, fakeContract, fakeVault, fakeTreasury, fakeInsurance, fakeBridge, token1] = await ethers.getSigners();
  bob.name = 'bob';
  alice.name = 'alice';

  return {
    owner,
    master,
    proxyOwner,
    bob,
    alice,
    user3,
    user4,
    badUser1,
    badUser2,
    fakeContract,
    fakeVault,
    fakeTreasury,
    fakeInsurance,
    fakeBridge,
    token1
  };
};

export const encodeParams = (types: string[], values: any[]) => {
    return ethers.utils.solidityPack(types, values)
}

export const getCurrentBlock = async () => {
    return (await ethers.provider.getBlock("latest")).number
}
export const deployNew = async (contractName: string, params: any[] = []): Promise<Contract> => {
    const C = await ethers.getContractFactory(contractName)
    return await C.deploy(...params)
}
