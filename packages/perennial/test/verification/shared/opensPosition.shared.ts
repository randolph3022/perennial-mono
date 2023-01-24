import { expect, util } from 'chai'
import { utils, constants } from 'ethers'
import HRE from 'hardhat'
import { impersonateWithBalance } from '../../../../common/testutil/impersonate'
import { expectPositionEq } from '../../../../common/testutil/types'
import { Collateral__factory, IERC20Metadata__factory, Product } from '../../../types/generated'
import { setupTokenHolders } from '../../integration/helpers/setupHelpers'
import { Deployment } from 'hardhat-deploy/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '../../../../common/testutil'

const { ethers, config } = HRE

const ETH_AGGREGATOR_TRANSMITTER = '0x218b5a7861dbf368d09a84e0dbff6c6ddbf99db8'
const ETH_AGGREGATOR_ADDRESS = '0x37bc7498f4ff12c19678ee8fe19d713b87f6a9e6'
const POSITION = utils.parseEther('0.01')

export default async function opensPositions(
  product: Product,
  signer: SignerWithAddress,
  deployments: { [name: string]: Deployment },
): Promise<void> {
  await time.reset(config)

  const transmitterSigner = await impersonateWithBalance(ETH_AGGREGATOR_TRANSMITTER, utils.parseEther('10'))

  const collateral = Collateral__factory.connect(deployments['Collateral_Proxy'].address, signer)
  const dsu = IERC20Metadata__factory.connect(deployments['DSU'].address, signer)

  const [, userA, userB] = await ethers.getSigners()
  const { dsuHolder } = await setupTokenHolders(dsu, [])

  await dsu.connect(dsuHolder).approve(collateral.address, constants.MaxUint256)
  await collateral.connect(dsuHolder).depositTo(userA.address, product.address, utils.parseEther('1000'))
  await collateral.connect(dsuHolder).depositTo(userB.address, product.address, utils.parseEther('1000'))

  await expect(product.connect(userA).openMake(POSITION)).to.not.be.reverted
  await expect(product.connect(userB).openTake(POSITION)).to.not.be.reverted

  const pre = await product['pre()']()
  expectPositionEq(pre.openPosition, { maker: POSITION, taker: POSITION })
  expectPositionEq(pre.closePosition, { maker: 0, taker: 0 })

  const latestVersion = await product['latestVersion()']()
  const latestPosition = await product.positionAtVersion(latestVersion)
  // Push a new price version to the aggregator
  await transmitterSigner.sendTransaction({
    to: ETH_AGGREGATOR_ADDRESS,
    value: 0,
    data: '0xc9807539000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000680000001000001000001010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004600000000000000000000000d02ee3e7b93bbe024d583e46d7fe54450000637e0307121618030b0a0f1017131b060d020e051115141a19080c041c1d09011e00000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001f00000000000000000000000000000000000000000000000000000025c233d03400000000000000000000000000000000000000000000000000000025c309f68000000000000000000000000000000000000000000000000000000025c309f68000000000000000000000000000000000000000000000000000000025c326458000000000000000000000000000000000000000000000000000000025c3ba49a600000000000000000000000000000000000000000000000000000025c3ba49a600000000000000000000000000000000000000000000000000000025c45986cc00000000000000000000000000000000000000000000000000000025c497ef5c00000000000000000000000000000000000000000000000000000025c4f9108700000000000000000000000000000000000000000000000000000025c4f9108700000000000000000000000000000000000000000000000000000025c511383000000000000000000000000000000000000000000000000000000025c520054000000000000000000000000000000000000000000000000000000025c55d0e4000000000000000000000000000000000000000000000000000000025c57d1f3c00000000000000000000000000000000000000000000000000000025c5b73c3000000000000000000000000000000000000000000000000000000025c5b7e04000000000000000000000000000000000000000000000000000000025c5bbd01000000000000000000000000000000000000000000000000000000025c5bbd01000000000000000000000000000000000000000000000000000000025c5bbd01000000000000000000000000000000000000000000000000000000025c5c1756000000000000000000000000000000000000000000000000000000025c5ec2ee000000000000000000000000000000000000000000000000000000025c5ec2ee000000000000000000000000000000000000000000000000000000025c5fdd83000000000000000000000000000000000000000000000000000000025c5fecc8000000000000000000000000000000000000000000000000000000025c614294000000000000000000000000000000000000000000000000000000025c6236b8000000000000000000000000000000000000000000000000000000025c62b0ca000000000000000000000000000000000000000000000000000000025c634828000000000000000000000000000000000000000000000000000000025c6bd26a100000000000000000000000000000000000000000000000000000025c6bd26a100000000000000000000000000000000000000000000000000000025c7a0e3c0000000000000000000000000000000000000000000000000000000000000000be32a36813c06b85b453cecedce8105af3096411d564fd0b4ee14059db4f0b248e49f256bdf03b543f515863006b4b92c16a7f2db302c9052d8ee4801ae6e47d18b170ebe26e4c449e55b1e6ab3f6603392ce69e542f62f157c1cfec09e2b17b93856141c589f9de601d08ce30fa6ef8c7df4d58c785890d7fe0837d9545f1bf04fd257fe555d525447f87604a16f8fbcc8991272297eecdc96a76cba6151549571f101c07e62f545c49c8bb05d6a6856b1d573dcfd9e58e6a48db6367683917d356b94be544a874cbe93af7f42c1f08a89b9393a508cc41422ec9769e2876bdfc063974b6c7ae9315e295fec278f69c01fcdf3e048ba66d860582e612b00635e3860623f9102256b875aba7e4d8de31dc57d7e7121b15ecd3c07290afe2e1b6c1c27486bef3e3284ab297d67641695ea054fd2ee239eae4745e33ee3853d8da5c67acffa0be14d639de983403f1f09fa7995711873aa776686e5164f51ad0b9e000000000000000000000000000000000000000000000000000000000000000b1188261048dca9e33490656104b845619cda630c3b7a1d33642a705b66dcd2646ff859db2053ceee6d8f34d07fb196ad628372e96d1bf13d51b81294079073b26d9a910d1bafcc2c07ef4768856b1c83d49a726399c558314429367aa036f225422d25aa494ab5536dc12376ede011d45b50978ce98a972e46c7f09793075b8579190b05c91e5cac0aa3dbd12dad6b3a26550ba737f55943afb27a63ef28f2076231cb780dc73d689fcf772ef8c7d26ce4f8c01d8b6c388763fe539b1154e1b043c37beb5c62528e4b00dae076552fde6c8108d871e8ec0da70d3d5a423581ed7b102ca6bdb87a027bc6343ecce71fbf56c5f39edbe9c060ad354468943f8fa825208f17c7d83e5b064ae0aa5940f797e30cd2a4da9991fd3f936083fa15c50455ba7c245aba4860ee72fe5d1075b5be7dd3d0cf9d404a80a30744707d8009c66032ccf98302b5ae19d5824f5c7903ca6808aab80d1e9361bdff1ab8def38ae4',
  })
  await expect(product.settle()).to.not.be.reverted
  const nextVersion = await product['latestVersion()']()

  expect(nextVersion).to.equal(latestVersion.add(1))
  expectPositionEq(await product.positionAtVersion(nextVersion), {
    maker: POSITION.add(latestPosition.maker),
    taker: POSITION.add(latestPosition.taker),
  })

  await expect(product.settleAccount(userA.address)).to.not.be.reverted
  expect(await product['latestVersion(address)'](userA.address)).to.equal(nextVersion)
  expectPositionEq(await product.position(userA.address), { maker: POSITION, taker: 0 })

  await expect(product.settleAccount(userB.address)).to.not.be.reverted
  expect(await product['latestVersion(address)'](userB.address)).to.equal(nextVersion)
  expectPositionEq(await product.position(userB.address), { maker: 0, taker: POSITION })

  await expect(collateral.connect(userA).withdrawTo(userA.address, product.address, utils.parseEther('10'))).to.not.be
    .reverted
  await expect(collateral.connect(userB).withdrawTo(userB.address, product.address, utils.parseEther('10'))).to.not.be
    .reverted
}
