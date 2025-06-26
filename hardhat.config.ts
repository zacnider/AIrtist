require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 54000000000, // 54 gwei
      gas: 8000000,
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: "dummy-api-key", // Monad Explorer doesn't require API key
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://sourcify-api-monad.blockvision.org",
          browserURL: "https://testnet.monadexplorer.com",
        },
      },
    ],
  },
};
