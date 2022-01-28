const hre = require('hardhat')

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

const {splitSignature} = require("@ethersproject/bytes");

async function main () {
  const ethers = hre.ethers
  
  const {parseEther, formatEther} = ethers.utils;

  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider)

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('network:', await ethers.provider.getNetwork())

  // const signer = (await ethers.getSigners())[0]
  
  // const signerAddress1 = await signer.getAddress();
  
  // console.log('signer:', await signer.getAddress(),signerAddress1)


  const presaleSigner = new ethers.Wallet(process.env.MINT_SIGNER_PRIVATE_KEY, ethers.provider)

  const presaleSignerAddress = presaleSigner.address;

  console.log('presaleSigner:',presaleSignerAddress, formatEther(await presaleSigner.getBalance()));

  console.log(' --------------------------------------- ')
  
  console.log('Deploying EVCoinPresale contract')

  const EVCoinPresale = await ethers.getContractFactory('EVCoinPresale', deployer)

  const EVCoin = await ethers.getContractFactory("EVCoin", deployer);


  const evcoin = await EVCoin.deploy();
  await evcoin.deployed();

  console.log("evcoin token Contract deployed to ", evcoin.address)


  const USDT = await ethers.getContractFactory("USDT", deployer);


  const usdt = await USDT.deploy();
  await usdt.deployed();

  console.log("test usdt Contract deployed to ", usdt.address)


  const evcoinPresaler = await EVCoinPresale.deploy(evcoin.address,presaleSignerAddress);

  await evcoinPresaler.deployed();

  console.log("evcoinPresaler Contract deployed to ", evcoinPresaler.address)

  console.log('user evcoin balance:',(await evcoin.balanceOf(deployer.address)))

  let tx



  tx = await evcoin.transfer(evcoinPresaler.address,  parseEther('100000'))
  await tx.wait()

  console.log("evcoin transfer to presale")

  console.log('user evcoin balance:',(await evcoin.balanceOf(deployer.address)))


  tx = await usdt.approve(evcoinPresaler.address,  parseEther('100'))
  await tx.wait()

  console.log("usdt approve to presale")


  const messageHash = await presaleSigner.encodePackedData(deployer.address, 2,2)

  let { r, s, v } = splitSignature(await presaleSigner.signMessage(ethers.utils.arrayify(messageHash)))


  tx = await evcoinPresaler.claimPresaleNFT([2,2,v,r,s])

  await tx.wait()

  console.log('claimPresaleNFT')


  console.log('deployer nft balance count',(await everestynft.balanceOf(deployer.address)))


  console.log('------------------------------------------')

  await sleep(10)

  tx = await evcoin.approve(evcoinStaker.address,parseEther('1000'))
  await tx.wait()

  console.log('approve token to staker:')

  tx = await evcoinStaker.stake(parseEther('1000'))
  await tx.wait()
  
  console.log('stake evcoin success:')

  
  console.log('user evcoin balance before withdraw:',formatEther((await evcoin.balanceOf(deployer.address))))

  tx = await evcoinStaker.withdraw(parseEther('100'))
  await tx.wait()

  console.log('user evcoin balance after withdraw:',formatEther( (await evcoin.balanceOf(deployer.address))))


  console.log('user staked pendingReward1:',  (await evcoinStaker.pendingReward(deployer.address)))

  {
    const messageHash = await evcoinStaker.encodePackedData(deployer.address, 1000,"sdgsd")

    let { r, s, v } = splitSignature(await stakeSigner.signMessage(ethers.utils.arrayify(messageHash)))

    tx = await evcoinStaker.claimSatkeNFT([1000,"sdgsd",v,r,s])
    await tx.wait()
  }



  console.log('claimSatkeNFT')

  console.log('deployer nft balance count',formatEther( (await everestynft.balanceOf(deployer.address))))



  console.log('user staked pendingReward:',formatEther((await evcoinStaker.pendingReward(deployer.address))))

  console.log('user evcoin balance:',formatEther((await evcoin.balanceOf(deployer.address))))


  console.log('harvest start ----- :')
  tx = await evcoinStaker.harvest()
  await tx.wait()

  console.log('user staked pendingReward:',(await evcoinStaker.pendingReward(deployer.address)))

  console.log('user evcoin balance:',formatEther((await evcoin.balanceOf(deployer.address))))

}



main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
