const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTArtistCollection to Monad Testnet...");

  // Get the contract factory
  const NFTArtistCollection = await hre.ethers.getContractFactory("NFTArtistCollection");
  
  console.log("📦 Deploying contract...");
  
  // Deploy the contract
  const nftContract = await NFTArtistCollection.deploy();
  
  // Wait for deployment
  await nftContract.waitForDeployment();
  
  const contractAddress = await nftContract.getAddress();
  
  console.log("✅ NFTArtistCollection deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 View on Monad Explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
  
  // Wait for a few block confirmations before verification
  console.log("⏳ Waiting for block confirmations...");
  await nftContract.deploymentTransaction().wait(5);
  
  // Verify the contract
  console.log("🔍 Verifying contract on Monad Explorer...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
    console.log("💡 You can verify manually later using:");
    console.log(`npx hardhat verify ${contractAddress} --network monadTestnet`);
  }
  
  // Display deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=====================");
  console.log("Contract Name: NFTArtistCollection");
  console.log("Network: Monad Testnet");
  console.log("Contract Address:", contractAddress);
  console.log("Explorer URL:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
  
  // Update frontend configuration
  console.log("\n🔧 FRONTEND CONFIGURATION");
  console.log("=========================");
  console.log("Update your src/lib/config.ts file with:");
  console.log(`export const NFT_CONTRACT_ADDRESS = "${contractAddress}" as const`);
  
  // Display contract features
  console.log("\n🎯 CONTRACT FEATURES");
  console.log("===================");
  console.log("✅ ERC721 NFT Standard");
  console.log("✅ Collection Management");
  console.log("✅ Batch Minting (up to 50 NFTs)");
  console.log("✅ 0.001 MON mint fee per NFT");
  console.log("✅ Max 10,000 NFTs per collection");
  console.log("✅ IPFS metadata support");
  console.log("✅ Owner controls & emergency functions");
  
  // Test the deployment
  console.log("\n🧪 TESTING DEPLOYMENT");
  console.log("=====================");
  
  try {
    // Test basic contract functions
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    const mintPrice = await nftContract.MINT_PRICE();
    
    console.log("Contract Name:", name);
    console.log("Contract Symbol:", symbol);
    console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "MON");
    
    console.log("✅ Contract is working correctly!");
    
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("You can now use the Collection Creator in your dApp!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });