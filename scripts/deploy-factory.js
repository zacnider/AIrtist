const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Collection Factory...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  try {
    // Deploy the Factory contract
    console.log("\n📦 Deploying NFTCollectionFactory...");
    const NFTCollectionFactory = await hre.ethers.getContractFactory("NFTCollectionFactory");
    const factory = await NFTCollectionFactory.deploy();
    
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    
    console.log("✅ NFTCollectionFactory deployed to:", factoryAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const totalCollections = await factory.getTotalCollections();
    const creationFee = await factory.creationFee();
    const factoryFeePercentage = await factory.factoryFeePercentage();
    
    console.log("Total collections:", totalCollections.toString());
    console.log("Creation fee:", hre.ethers.formatEther(creationFee), "ETH");
    console.log("Factory fee percentage:", factoryFeePercentage.toString(), "%");

    // Test creating a sample collection
    console.log("\n🧪 Testing collection creation...");
    const createTx = await factory.createCollection(
      "Test Collection",
      "TEST",
      "A test NFT collection",
      100, // maxSupply
      hre.ethers.parseEther("0.001"), // mintPrice
      { value: creationFee }
    );
    
    const receipt = await createTx.wait();
    console.log("✅ Test collection created successfully!");
    
    // Get the created collection info
    const collectionInfo = await factory.getCollection(1);
    console.log("Collection contract address:", collectionInfo.contractAddress);
    console.log("Collection name:", collectionInfo.name);
    console.log("Collection creator:", collectionInfo.creator);

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      factoryAddress: factoryAddress,
      testCollectionAddress: collectionInfo.contractAddress,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      creationFee: hre.ethers.formatEther(creationFee),
      factoryFeePercentage: factoryFeePercentage.toString()
    };

    const fs = require('fs');
    const path = require('path');
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, `factory-${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment info saved to:", deploymentFile);

    // Update frontend config
    const frontendConfigPath = path.join(__dirname, '..', 'src', 'lib', 'contracts.ts');
    const configContent = `// Auto-generated contract addresses
export const CONTRACTS = {
  FACTORY_ADDRESS: "${factoryAddress}",
  NETWORK: "${hre.network.name}",
  CREATION_FEE: "${hre.ethers.formatEther(creationFee)}",
  FACTORY_FEE_PERCENTAGE: ${factoryFeePercentage}
} as const;

export type ContractAddresses = typeof CONTRACTS;
`;

    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("✅ Frontend config updated:", frontendConfigPath);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("Factory Address:", factoryAddress);
    console.log("Test Collection Address:", collectionInfo.contractAddress);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });