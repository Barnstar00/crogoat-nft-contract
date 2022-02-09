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

  
  const owner = await new ethers.Wallet('', ethers.provider)
  

  console.log("owner with the account:", owner.address);

  console.log("owner balance:", (await owner.getBalance()).toString());
  console.log('deployer creator:')


  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider)

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('network:', await ethers.provider.getNetwork())


  const testSigner = new ethers.Wallet(process.env.MINT_SIGNER_PRIVATE_KEY, ethers.provider)

  const testSignerAddress = testSigner.address;

  console.log('testSignerAddress:',testSignerAddress, formatEther(await testSigner.getBalance()));

  let order = []
  for(let i=1;i<100;i++){
    order.push(i)
  }

  console.log(' --------------------------------------- ')
  
  console.log('Deploying Goat NFT contract')

  const CronosGoats = await ethers.getContractFactory('CronosGoats', deployer)

  // const crogoats = await CronosGoats.deploy(owner.address,owner.address,order);
  // await crogoats.deployed();

  const crogoats = await CronosGoats.attach('0xAbCfF74756B1DBCaBae73651C7E0a64bFA34E92B');

  console.log("crogoats nft Contract deployed to ", crogoats.address)

  const GoatStaking = await ethers.getContractFactory('GoatStaking', deployer)

  // const goatstaker = await GoatStaking.deploy(crogoats.address);
  // await goatstaker.deployed();

  const goatstaker = await GoatStaking.attach('0x4089321F96F32c46EC7e312640bc5051B9FD9CDB');

  console.log("goatstaker Contract deployed to ", goatstaker.address)




  let tx

  // tx = await crogoats.setApprovalForAll(goatstaker.address,true)
  // await tx.wait()

  console.log("approve goat nft of deployer to staker")


  console.log('deployer nft balance count of the deployer:',(await crogoats.balanceOf(deployer.address)))

  const mintedNfts = await goatstaker.userWalletNFT(deployer.address);

  // tx = await crogoats.transferFrom(
  //   deployer.address,
  //   owner.address,
  //   mintedNfts[17]
  // );

  // await tx.wait()

  // console.log('send goat  to the owner',mintedNfts[17])

  // console.log('deployer nfts:',mintedNfts)

  // tx = await goatstaker.batchStake([mintedNfts[1],mintedNfts[4],mintedNfts[2]])
  // await tx.wait()

  // console.log('--stake nft:')



  // console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))

  // await sleep(10)


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));


  console.log('totalShares:', await goatstaker.totalShares());
  console.log('totalDividends:', formatEther(await goatstaker.totalDividends()));
  console.log('totalDistributed:', formatEther(await goatstaker.totalDistributed()));
  console.log('dividendsPerShare:', formatEther(await goatstaker.dividendsPerShare()));

  const userShareAmount = await goatstaker.shares(deployer.address);

  console.log('userShare:2', formatEther(userShareAmount[2]));
  console.log('userShare:1', formatEther(userShareAmount[1]));
  console.log('userShare:0', formatEther(userShareAmount[0]));



  tx = await goatstaker.depositReward( {value:parseEther('0.1')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  





  // console.log('call distributeReward:')
  // tx = await goatstaker.distributeReward()
  // await tx.wait()

  console.log('after distribute deployer:',deployer.address, formatEther(await deployer.getBalance()));

  
  // console.log('nft start withdraw ----- :')

  // tx = await goatstaker.unstake(mintedNfts[4])
  // await tx.wait()

  console.log('check withdraw: isStaked:',(await goatstaker.isStaked(deployer.address,mintedNfts[4])))

  console.log('user staked nft counnt:',(await goatstaker.userStakedNFTCount(deployer.address)))


  console.log('other user stake goat nfts*************************************')

  const ownermintedNfts = await goatstaker.userWalletNFT(owner.address);

  // tx = await crogoats.connect(owner).setApprovalForAll(goatstaker.address,true)
  // await tx.wait()

  console.log('other user approve nft to the staker',ownermintedNfts)


  // tx = await goatstaker.connect(owner).batchStake([ownermintedNfts[0]])
  // await tx.wait()


  console.log('owner staked nft counnt:',(await goatstaker.userStakedNFTCount(owner.address)))

  await sleep(10)


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  {

    console.log('totalShares:', await goatstaker.totalShares());
    console.log('totalDividends:', formatEther(await goatstaker.totalDividends()));
    console.log('totalDistributed:', formatEther(await goatstaker.totalDistributed()));
    console.log('dividendsPerShare:', formatEther(await goatstaker.dividendsPerShare()));
  
    const userShareAmount = await goatstaker.shares(deployer.address);
  
    console.log('userShare:2', formatEther(userShareAmount[2]));
    console.log('userShare:1', formatEther(userShareAmount[1]));
    console.log('userShare:0', formatEther(userShareAmount[0]));

    console.log('getUnpaidEarnings deployer:',deployer.address, formatEther(await goatstaker.getUnpaidEarnings(deployer.address)));
  }


  tx = await goatstaker.depositReward( {value:parseEther('0.1')})
  await tx.wait()

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));


  // console.log('owner staked nft :',(await goatstaker.userStakedNFT(owner.address)))

  {

    console.log('totalShares:', formatEther(await goatstaker.totalShares()));
    console.log('totalDividends:', formatEther(await goatstaker.totalDividends()));
    console.log('totalDistributed:', formatEther(await goatstaker.totalDistributed()));
    console.log('dividendsPerShare:', formatEther(await goatstaker.dividendsPerShare()));
  
    const userShareAmount = await goatstaker.shares(deployer.address);
  
    console.log('deployer userShare:2', formatEther(userShareAmount[2]));
    console.log('deployer userShare:1', formatEther(userShareAmount[1]));
    console.log('userShare:0', userShareAmount[0]);

    console.log('getUnpaidEarnings deployer:',deployer.address, formatEther(await goatstaker.getUnpaidEarnings(deployer.address)));

    tx = await goatstaker.connect(deployer).claimDividend()
    await tx.wait()


    const userShareAmount2 = await goatstaker.shares(deployer.address);
  
    console.log('after claimDividend deployer userShare:2', formatEther(userShareAmount2[2]));
    console.log('deployer userShare:1', formatEther(userShareAmount2[1]));
    console.log('userShare:0', userShareAmount2[0]);

    console.log('after claimDividend getUnpaidEarnings deployer:',deployer.address, formatEther(await goatstaker.getUnpaidEarnings(deployer.address)));

  }

  {
  
    const userShareAmount = await goatstaker.shares(owner.address);
  
    console.log('userShare:2', formatEther(userShareAmount[2]));
    console.log('userShare:1', formatEther(userShareAmount[1]));
    console.log('userShare:0', userShareAmount[0]);

    console.log('getUnpaidEarnings owner:',owner.address, formatEther(await goatstaker.getUnpaidEarnings(owner.address)));
  }



  

  // tx = await goatstaker.connect(owner).unstake(ownermintedNfts[0])
  // await tx.wait()


  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('owner:',owner.address, formatEther(await owner.getBalance()));

  console.log('staker :',goatstaker.address, formatEther(await goatstaker.provider.getBalance(goatstaker.address)));

  console.log('getUnpaidEarnings owner:',owner.address, formatEther(await goatstaker.getUnpaidEarnings(owner.address)));

  tx = await goatstaker.connect(owner).claimDividend()
  await tx.wait()

  console.log('after getUnpaidEarnings owner:',owner.address, formatEther(await goatstaker.getUnpaidEarnings(owner.address)));


  
  {
  
    const userShareAmount = await goatstaker.shares(owner.address);
  
    console.log('after userShare:2', formatEther(userShareAmount[2]));
    console.log('after userShare:1', formatEther(userShareAmount[1]));
    console.log('after userShare:0', userShareAmount[0]);

    console.log('after getUnpaidEarnings owner:',owner.address, formatEther(await goatstaker.getUnpaidEarnings(owner.address)));
  }




}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
