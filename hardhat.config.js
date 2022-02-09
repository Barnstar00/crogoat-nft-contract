require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
// require('@eth-optimism/plugins/hardhat/compiler')
// require('@eth-optimism/plugins/hardhat/ethers')

require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require( "hardhat-abi-exporter")
require("@nomiclabs/hardhat-solhint");
require( "hardhat-deploy")
require("hardhat-deploy-ethers")

module.exports = {
  abiExporter: {
    path: "./abi",
    clear: false,
    flat: true,
    // only: [],
    // except: []
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    dev: {
      // Default to 1
      default: 1,
      // dev address mainnet
      // 1: "",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://evm-cronos.crypto.org',
      },
      gasPrice: 120 * 100000000,
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    rinkeby: {
      url: process.env.L1_NODE_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      gasPrice: 120 * 1000000000,
      chainId: 1,
    },
    cro: {
      url: `https://evm-cronos.crypto.org`,
      gasPrice: 120 * 1000000000,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 25,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 56,
    },
  },
  paths: {
    artifacts: "artifacts",
    cache: "cache",
    deploy: "deploy",
    deployments: "deployments",
    imports: "imports",
    sources: "contracts",
    tests: "test",
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      },
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      },
    ]
  },
  etherscan: {
    apiKey: "VAQR1ZTXINETMQ7PGPFGSY6HZSZ93JBQDE"
  }
}
