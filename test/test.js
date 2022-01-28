const hre = require('hardhat')

const axios = require('axios');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

const {splitSignature} = require("@ethersproject/bytes");

async function main () {
  const ethers = hre.ethers
  
  const {parseEther, formatEther} = ethers.utils;

  const upgrades = hre.upgrades;

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
  
  console.log('Deploying HatchyStaking contract')

  const HatchyStaking = await ethers.getContractFactory('HatchyStaking', deployer)

  const PockyToken = await ethers.getContractFactory("POCKY", deployer);

  const HatchyPockets = await ethers.getContractFactory("HatchyPockets", deployer);

  const pocky = await PockyToken.deploy();
  await pocky.deployed();

  console.log("pocky token Contract deployed to ", pocky.address)


  const hatchynft = await HatchyPockets.deploy();
  await hatchynft.deployed();

  console.log("hatchynft Contract deployed to ", hatchynft.address)


  const hatchyStaker = await HatchyStaking.deploy(pocky.address, hatchynft.address,deployer.address,stakeSignerAddress,'100000000000000');

  await hatchyStaker.deployed();

  console.log("hatchyStaker Contract deployed to ", hatchyStaker.address)


  let tx

  tx = await pocky.transfer(hatchyStaker.address,  parseEther('100000000'))
  await tx.wait()

  console.log("pocky transfer to staker")

  tx = await hatchynft.startDrop()
  await tx.wait()

  console.log("start drop")

  console.log('deployer  current nfts:',(await hatchynft.tokensOfOwner(deployer.address)))


  tx = await hatchynft.claimHatchie(2, {value:parseEther('0.001')})
  await tx.wait()

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  // await tx.wait()

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  // await tx.wait()

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  // await tx.wait()

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  // await tx.wait()

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  // await tx.wait()


  console.log("hatchynft cliam nft to the deployer")

  // tx = await hatchynft.claimHatchie(20, {value:parseEther('3')})
  // await tx.wait()

  // console.log("hatchynft cliam nft to the deployer 2")


  console.log('deployer nft balance count',(await hatchynft.balanceOf(deployer.address)))

  const mintedNfts = await hatchynft.tokensOfOwner(deployer.address);

  console.log('deployer nfts:',mintedNfts)

  
  tx = await hatchynft.setApprovalForAll(hatchyStaker.address,true)
  await tx.wait()

  console.log('approve all nft to the staker')


  for(let index = 0;index<mintedNfts.length;index ++){

    const tokenUri1 = await hatchynft.tokenURI(mintedNfts[index]);

    // console.log('my nft token uri:',tokenUri1)

    const nftInfo = (await getTokenInfo(tokenUri1));

    // console.log('my nft token info:',nftInfo)

    const elementStr =  nftInfo.attributes.find(item => item.trait_type === 'Element').value;

    const element =  getElement(elementStr);

    console.log('nft info:',nftInfo.tokenId,nftInfo.monsterId,element,elementStr)

    const messageHash = await hatchyStaker.encodePackedData(deployer.address, nftInfo.tokenId,nftInfo.monsterId,element,nftInfo.isShiny)

    let { r, s, v } = splitSignature(await stakeSigner.signMessage(ethers.utils.arrayify(messageHash)))

    console.log('messageHash:',nftInfo.isShiny,messageHash,r, s, v, )

    // console.log('check signer role:',(await hatchyStaker.isSigner(stakeSignerAddress)))

    tx = await hatchyStaker.stake([nftInfo.tokenId,nftInfo.monsterId,nftInfo.isShiny,nftInfo.character,nftInfo.serial,nftInfo.weight,element,elementStr,v,r,s])
    await tx.wait()

    console.log('user stake weight:',(await hatchyStaker.calculateWeight(deployer.address)))

    console.log('user staked nft:',(await hatchyStaker.userStakedNFTCount(deployer.address)))

  }

  console.log('------------------------------------------')

  console.log('--all nft staked:')

  console.log('user stake weight:',(await hatchyStaker.calculateWeight(deployer.address)))

  console.log('user staked nft counnt:',(await hatchyStaker.userStakedNFTCount(deployer.address)))

  await sleep(10)


  
  console.log('nft start withdraw ----- :')

  tx = await hatchyStaker.withdraw(mintedNfts[4])
  await tx.wait()

  console.log('check withdraw: isStaked:',(await hatchyStaker.isStaked(deployer.address,mintedNfts[4])))

  console.log('user stake weight:',(await hatchyStaker.calculateWeight(deployer.address)))

  console.log('user staked nft counnt:',(await hatchyStaker.userStakedNFTCount(deployer.address)))

  console.log('nft start withdraw ----- :')


  tx = await hatchyStaker.withdraw(mintedNfts[8])
  await tx.wait()

  console.log('check withdraw: isStaked:',(await hatchyStaker.isStaked(deployer.address,mintedNfts[8])))

  await sleep(10)

  console.log('user stake weight:',(await hatchyStaker.calculateWeight(deployer.address)))


  console.log('user staked nft counnt:',(await hatchyStaker.userStakedNFTCount(deployer.address)))

  console.log('my current nfts:',(await hatchynft.tokensOfOwner(deployer.address)))

  
  tx = await hatchynft.claimHatchie(20, {value:parseEther('0.001')})
  await tx.wait()


  console.log("hatchynft cliam nft to the deployer")

  console.log('user staked pendingReward:',(await hatchyStaker.pendingReward(deployer.address)))

  console.log('user pocky balance:',(await pocky.balanceOf(deployer.address)))

  console.log('harvest start ----- :')
  tx = await hatchyStaker.harvest()
  await tx.wait()

  console.log('user staked pendingReward:',(await hatchyStaker.pendingReward(deployer.address)))

  console.log('user pocky balance:',(await pocky.balanceOf(deployer.address)))

}
function getElement(elementStr){
  if(elementStr ==='Void'){
    return 0;
  }else   if(elementStr ==='Plant'){
    return 1;
  }else   if(elementStr ==='Water'){
    return 2;
  }else   if(elementStr ==='Fire'){
    return 3;
  }else   if(elementStr ==='Dark'){
    return 4;
  }else   if(elementStr ==='Light'){
    return 5;
  }
  return 0;
}

async function getTokenInfo(url) {
  let response
  try {
    response = await axios.get( url )
  } catch (error) {
    console.log(' --- api server error: ', error.message)
    return {};
  }

  const nftInfo = response.data
  if (!response.status === 200) {
    console.log(' -- error get nft info', url)
    return {};
  }
  return nftInfo
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
