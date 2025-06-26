const hre = require("hardhat");

/**
 * Automatically verify a newly created collection contract
 * @param {string} contractAddress - The address of the collection contract
 * @param {string} name - Collection name
 * @param {string} symbol - Collection symbol
 * @param {string} description - Collection description
 * @param {number} maxSupply - Maximum supply
 * @param {string} mintPrice - Mint price in wei
 * @param {string} creator - Creator address
 * @param {string} factory - Factory address
 */
async function verifyCollection(contractAddress, name, symbol, description, maxSupply, mintPrice, creator, factory) {
  console.log(`🔍 Verifying collection contract: ${contractAddress}`);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        name,
        symbol,
        description,
        maxSupply,
        mintPrice,
        creator,
        factory
      ],
      network: hre.network.name
    });
    
    console.log(`✅ Collection contract verified successfully!`);
    console.log(`🔗 View on explorer: https://testnet.monadexplorer.com/contracts/partial_match/10143/${contractAddress}/`);
    
    return true;
  } catch (error) {
    console.error(`❌ Verification failed:`, error.message);
    
    // If already verified, that's okay
    if (error.message.includes("Already Verified")) {
      console.log(`✅ Contract was already verified`);
      return true;
    }
    
    return false;
  }
}

/**
 * Verify collection from transaction receipt
 * @param {string} txHash - Transaction hash of collection creation
 */
async function verifyFromTransaction(txHash) {
  console.log(`🔍 Getting transaction details: ${txHash}`);
  
  try {
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error("Transaction not found");
    }
    
    // Parse the CollectionCreated event
    const factoryInterface = new hre.ethers.Interface([
      "event CollectionCreated(uint256 indexed collectionId, address indexed contractAddress, string name, address indexed creator, uint256 maxSupply)"
    ]);
    
    let collectionCreatedEvent = null;
    for (const log of receipt.logs) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (parsed.name === "CollectionCreated") {
          collectionCreatedEvent = parsed;
          break;
        }
      } catch (e) {
        // Skip logs that don't match our interface
        continue;
      }
    }
    
    if (!collectionCreatedEvent) {
      throw new Error("CollectionCreated event not found in transaction");
    }
    
    const { contractAddress, name, creator, maxSupply } = collectionCreatedEvent.args;
    
    console.log(`📋 Collection Details:`);
    console.log(`   Name: ${name}`);
    console.log(`   Address: ${contractAddress}`);
    console.log(`   Creator: ${creator}`);
    console.log(`   Max Supply: ${maxSupply}`);
    
    // Get additional details from the collection contract
    const collection = await hre.ethers.getContractAt("IndividualNFTCollection", contractAddress);
    
    const symbol = await collection.symbol();
    const description = await collection.collectionDescription();
    const mintPrice = await collection.mintPrice();
    const factory = await collection.factory();
    
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Description: ${description}`);
    console.log(`   Mint Price: ${hre.ethers.formatEther(mintPrice)} ETH`);
    
    // Verify the contract
    return await verifyCollection(
      contractAddress,
      name,
      symbol,
      description,
      maxSupply,
      mintPrice.toString(),
      creator,
      factory
    );
    
  } catch (error) {
    console.error(`❌ Error processing transaction:`, error.message);
    return false;
  }
}

// CLI usage
async function main() {
  // When run with hardhat, arguments come after --
  const allArgs = process.argv;
  const dashDashIndex = allArgs.indexOf('--');
  const args = dashDashIndex !== -1 ? allArgs.slice(dashDashIndex + 1) : allArgs.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  npx hardhat run scripts/auto-verify.js --network monad_testnet -- <transaction_hash>
  npx hardhat run scripts/auto-verify.js --network monad_testnet -- <contract_address> <name> <symbol> <description> <maxSupply> <mintPrice> <creator> <factory>

Examples:
  # Verify from transaction hash
  npx hardhat run scripts/auto-verify.js --network monad_testnet -- 0x1234...

  # Verify with manual parameters
  npx hardhat run scripts/auto-verify.js --network monad_testnet -- 0x1718b71E3e6f81CF9EFb985D83A37f3C210f93B1 "My Collection" "MYCOL" "Description" 100 "1000000000000000" "0xCreator..." "0xFactory..."
`);
    return;
  }
  
  if (args.length === 1) {
    // Verify from transaction hash
    const txHash = args[0];
    await verifyFromTransaction(txHash);
  } else if (args.length === 8) {
    // Verify with manual parameters
    const [contractAddress, name, symbol, description, maxSupply, mintPrice, creator, factory] = args;
    await verifyCollection(contractAddress, name, symbol, description, parseInt(maxSupply), mintPrice, creator, factory);
  } else {
    console.error("❌ Invalid number of arguments");
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  verifyCollection,
  verifyFromTransaction
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}