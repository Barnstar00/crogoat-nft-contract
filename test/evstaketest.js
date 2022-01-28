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


  const stakeSigner = new ethers.Wallet(process.env.MINT_SIGNER_PRIVATE_KEY, ethers.provider)

  const stakeSignerAddress = stakeSigner.address;

  console.log('stakeSigner:',stakeSignerAddress, formatEther(await stakeSigner.getBalance()));

  console.log(' --------------------------------------- ')
  
  console.log('Deploying EVCoinStaking contract')

  const EVCoinStaking = await ethers.getContractFactory('EVCoinStaking', deployer)

  const EVCoin = await ethers.getContractFactory("EVCoin", deployer);

  const EverestNFT = await ethers.getContractFactory("EverestNFT", deployer);

  const evcoin = await EVCoin.deploy();
  await evcoin.deployed();

  console.log("evcoin token Contract deployed to ", evcoin.address)


  const everestynft = await EverestNFT.deploy();
  await everestynft.deployed();



  console.log("EverestNFT Contract deployed to ", everestynft.address)


  const evcoinStaker = await EVCoinStaking.deploy(evcoin.address,evcoin.address, everestynft.address,deployer.address,stakeSignerAddress,'1000000000000000000');

  await evcoinStaker.deployed();

  console.log("evcoinStaker Contract deployed to ", evcoinStaker.address)

  console.log('user evcoin balance:',(await evcoin.balanceOf(deployer.address)))

  let tx

  const minter_role = await everestynft.MINTER_ROLE()

  tx = await everestynft.grantRole(minter_role, evcoinStaker.address)
  await tx.wait()

  console.log('Set minter role for the staker')

  tx = await evcoin.transfer(evcoinStaker.address,  parseEther('100000'))
  await tx.wait()

  console.log("evcoin transfer to staker")

  console.log('user evcoin balance:',(await evcoin.balanceOf(deployer.address)))


  // tx = await evcoin.transfer(deployer.address,  parseEther('1000'))
  // await tx.wait()


  console.log('deployer nft balance count',(await everestynft.balanceOf(deployer.address)))


  const messageHash = await evcoinStaker.encodePackedData(deployer.address, 0,"sdgsd")

  let { r, s, v } = splitSignature(await stakeSigner.signMessage(ethers.utils.arrayify(messageHash)))


  tx = await evcoinStaker.claimPresaleNFT([0,"sdgsd",v,r,s])
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
