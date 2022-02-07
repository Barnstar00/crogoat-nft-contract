const hre = require('hardhat')

const axios = require('axios');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

const {splitSignature} = require("@ethersproject/bytes");

async function main () {
  const ethers = hre.ethers
  
  const {parseEther, formatEther} = ethers.utils;

  const upgrades = hre.upgrades;

  
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }

  
  const [owner] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);

  console.log("Account balance:", (await owner.getBalance()).toString());



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

  console.log("goatstaker distributer  deployed to ", (await goatstaker.distributor()))

  let tx

  tx = await crogoats.setApprovalForAll(goatstaker.address,true)
  await tx.wait()

  console.log("approve goat nft of deployer to staker")


  console.log('deployer nft balance count of the deployer:',(await crogoats.balanceOf(deployer.address)))

  const mintedNfts = await crogoats.tokensOfOwner(deployer.address);

  console.log('deployer nfts:',mintedNfts)

  tx = await goatstaker.batchStake([mintedNfts[1],mintedNfts[4],mintedNfts[2]])
  await tx.wait()

  console.log('--stake nft:')



  console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))

  await sleep(10)


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  tx = await goatstaker.depositReward( {value:parseEther('0.2')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  
  console.log('nft start withdraw ----- :')

  tx = await goatstaker.withdraw(mintedNfts[4])
  await tx.wait()

  console.log('check withdraw: isStaked:',(await goatstaker.isStaked(deployer.address,mintedNfts[4])))

  console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))


  console.log('other user stake goat nfts*************************************')

  const ownermintedNfts = await crogoats.tokensOfOwner(owner.address);

  tx = await goatstaker.connect(owner).batchStake([ownermintedNfts[1],ownermintedNfts[4],ownermintedNfts[2]])
  await tx.wait()


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  tx = await goatstaker.depositReward( {value:parseEther('0.2')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));




}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
