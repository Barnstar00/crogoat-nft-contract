const hre = require('hardhat')

const axios = require('axios');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

const {splitSignature} = require("@ethersproject/bytes");

async function main () {
  const ethers = hre.ethers
  
  const {parseEther, formatEther} = ethers.utils;

  const upgrades = hre.upgrades;

  
  // const accounts = await hre.ethers.getSigners();

  // for (const account of accounts) {
  //   console.log(account.address);
  // }

  
  const [owner] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);

  // console.log("Account balance:", (await owner.getBalance()).toString());
  console.log('deployer creator:')


  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider)

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('network:', await ethers.provider.getNetwork())


  const testSigner = new ethers.Wallet(process.env.MINT_SIGNER_PRIVATE_KEY, ethers.provider)

  const testSignerAddress = testSigner.address;

  console.log('testSignerAddress:',testSignerAddress, formatEther(await testSigner.getBalance()));

  let order = []
  for(let i=1;i<1000;i++){
    order.push(i)
  }



  console.log(' --------------------------------------- ')
  
  console.log('Deploying Goat NFT contract')

  const CronosGoats = await ethers.getContractFactory('CronosGoats', deployer)

  const crogoats = await CronosGoats.deploy(owner.address,owner.address,order);
  await crogoats.deployed();

  console.log("crogoats nft Contract deployed to ", crogoats.address)

  const GoatStaking = await ethers.getContractFactory('GoatStaking', deployer)

  const goatstaker = await GoatStaking.deploy(crogoats.address);
  await goatstaker.deployed();

  console.log("goatstaker Contract deployed to ", goatstaker.address)

  const distributor = await goatstaker.distributor()

  console.log("goatstaker distributer  deployed to ", distributor)

  let tx

  tx = await crogoats.setApprovalForAll(goatstaker.address,true)
  await tx.wait()

  console.log("approve goat nft of deployer to staker")


  console.log('deployer nft balance count of the deployer:',(await crogoats.balanceOf(deployer.address)))

  const mintedNfts = await goatstaker.userWalletNFT(deployer.address);

  // console.log('deployer nfts:',mintedNfts)

  tx = await goatstaker.batchStake([mintedNfts[1],mintedNfts[4],mintedNfts[2]])
  await tx.wait()

  console.log('--stake nft:')



  console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))

  await sleep(10)


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('distributor :',distributor, formatEther(await goatstaker.provider.getBalance(distributor)));


  tx = await goatstaker.depositReward( {value:parseEther('0.1')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('distributor :',distributor, formatEther(await goatstaker.provider.getBalance(distributor)));


  // console.log('call distributeReward:')
  // tx = await goatstaker.distributeReward()
  // await tx.wait()

  console.log('after distribute deployer:',deployer.address, formatEther(await deployer.getBalance()));

  
  console.log('nft start withdraw ----- :')

  tx = await goatstaker.unstake(mintedNfts[4])
  await tx.wait()

  console.log('check withdraw: isStaked:',(await goatstaker.isStaked(deployer.address,mintedNfts[4])))

  console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))


  console.log('other user stake goat nfts*************************************')

  const ownermintedNfts = await goatstaker.userWalletNFT(owner.address);

  tx = await crogoats.connect(owner).setApprovalForAll(goatstaker.address,true)
  await tx.wait()


  tx = await goatstaker.connect(owner).batchStake([ownermintedNfts[1],ownermintedNfts[4],ownermintedNfts[2],ownermintedNfts[6]])
  await tx.wait()


  console.log('owner staked nft counnt:',(await goatstaker.userStakedNFTCount(owner.address)))

  await sleep(10)


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('distributor :',distributor, formatEther(await goatstaker.provider.getBalance(distributor)));

  tx = await goatstaker.depositReward( {value:parseEther('0.1')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('distributor :',distributor, formatEther(await goatstaker.provider.getBalance(distributor)));


  // console.log('ownermintedNfts:',ownermintedNfts)
  tx = await goatstaker.connect(owner).batchStake([ownermintedNfts[8],ownermintedNfts[9],ownermintedNfts[13],ownermintedNfts[16]])
  await tx.wait()

  console.log('owner staked nft counnt:',(await goatstaker.userStakedNFTCount(owner.address)))

  // console.log('owner staked nft :',(await goatstaker.userStakedNFT(owner.address)))

  console.log('',ownermintedNfts[8])

  console.log('owner check withdraw: isStaked:',(await goatstaker.isStaked(owner.address,ownermintedNfts[8])))

  

  tx = await goatstaker.connect(owner).unstake(ownermintedNfts[8])
  await tx.wait()


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('distributor :',distributor, formatEther(await goatstaker.provider.getBalance(distributor)));




}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
