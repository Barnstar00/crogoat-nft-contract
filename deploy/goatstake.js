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



  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider)

  console.log('deployer:',deployer.address, formatEther(await deployer.getBalance()));

  console.log('network:', await ethers.provider.getNetwork())



  console.log(' --------------------------------------- ')
  
  console.log('Deploying Goat NFT contract')


  const crogoatAddress = '0x93a3906ff14c9aa4f33377ae94cc4a9858d346b9';

  const CronosGoats = await ethers.getContractFactory('CronosGoats', deployer)

  const crogoats = await CronosGoats.attach(crogoatAddress);
;

  console.log("crogoats nft Contract deployed to ", crogoats.address,crogoatAddress)

  const GoatStaking = await ethers.getContractFactory('GoatStaking', deployer)

  const goatstaker = await GoatStaking.deploy(crogoats.address);
  await goatstaker.deployed();

  console.log("goatstaker Contract deployed to ", goatstaker.address)

  const distributor = await goatstaker.distributor()

  console.log("goatstaker distributer  deployed to ", distributor)

  console.log('deployer nft balance count of the deployer:',(await crogoats.balanceOf(deployer.address)))

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
