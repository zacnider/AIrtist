const hre = require("hardhat");

async function main() {
  console.log("Deploying NFTMinter contract to Monad Testnet...");

  // Factory contract address
  const FACTORY_CONTRACT_ADDRESS = "0x7867B987ed2f04Afab67392d176b06a5b002d1F8";

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON");

  // Deploy NFTMinter contract
  const NFTMinter = await hre.ethers.getContractFactory("NFTMinter");
  const nftMinter = await NFTMinter.deploy(FACTORY_CONTRACT_ADDRESS);

  await nftMinter.waitForDeployment();

  const contractAddress = await nftMinter.getAddress();
  console.log("NFTMinter deployed to:", contractAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await nftMinter.deploymentTransaction().wait(5);

  // Verify contract on Monad Explorer
  console.log("Verifying contract on Monad Explorer...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [FACTORY_CONTRACT_ADDRESS],
      network: "monadTestnet",
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }

  // Display contract info
  console.log("\n=== Deployment Summary ===");
  console.log("NFTMinter Contract Address:", contractAddress);
  console.log("Factory Contract Address:", FACTORY_CONTRACT_ADDRESS);
  console.log("Network: Monad Testnet");
  console.log("Explorer URL:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
  
  // Test basic contract functions
  console.log("\n=== Testing Contract Functions ===");
  try {
    const mintPrice = await nftMinter.MINT_PRICE();
    console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "MON");
    
    const currentTokenId = await nftMinter.getCurrentTokenId();
    console.log("Current Token ID:", currentTokenId.toString());
    
    const totalSupply = await nftMinter.totalSupply();
    console.log("Total Supply:", totalSupply.toString());
    
    const factoryAddress = await nftMinter.factoryContract();
    console.log("Factory Contract:", factoryAddress);
    
    console.log("✅ All contract functions working correctly!");
  } catch (error) {
    console.log("❌ Error testing contract functions:", error.message);
  }

  console.log("\n=== Next Steps ===");
  console.log("1. Update your frontend config with the new NFTMinter address");
  console.log("2. Add the NFTMinter ABI to your frontend");
  console.log("3. Update your mint functions to use the new contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });