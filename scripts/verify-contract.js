const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Contract verification script for Monad Explorer
async function verifyContract(contractAddress, constructorArgs = []) {
  try {
    console.log(`Verifying contract at address: ${contractAddress}`);
    console.log('Chain ID: 10143 (Monad Testnet)');
    
    // Check if contract files exist
    const contractPath = path.join(__dirname, '../contracts/NFTCollection.sol');
    const artifactPath = path.join(__dirname, '../artifacts/contracts/NFTCollection.sol/NFTCollection.json');
    
    if (!fs.existsSync(contractPath)) {
      console.error('Contract source file not found:', contractPath);
      return;
    }
    
    if (!fs.existsSync(artifactPath)) {
      console.error('Contract artifact not found:', artifactPath);
      console.log('Please compile contracts first: npx hardhat compile');
      return;
    }
    
    // Read contract source and metadata
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    console.log('Contract source loaded, length:', contractSource.length);
    console.log('Artifact loaded, bytecode length:', artifact.bytecode.length);
    
    // Try multiple verification methods
    
    // Method 1: Sourcify API
    console.log('\n--- Trying Sourcify API ---');
    const sourcifyPayload = {
      address: contractAddress,
      chain: "10143",
      files: {
        "contracts/NFTCollection.sol": contractSource,
        "metadata.json": JSON.stringify(artifact.metadata)
      }
    };
    
    const sourcifyCommand = `curl -X POST "https://sourcify.dev/server/verify" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(sourcifyPayload).replace(/'/g, "'\\''")}' \
      --max-time 30`;
    
    exec(sourcifyCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('Sourcify verification failed:', error.message);
      } else {
        console.log('Sourcify result:', stdout);
      }
    });
    
    // Method 2: Hardhat verify (if available)
    console.log('\n--- Trying Hardhat Verify ---');
    const hardhatCommand = `npx hardhat verify --network monadTestnet ${contractAddress}`;
    
    exec(hardhatCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('Hardhat verification failed:', error.message);
      } else {
        console.log('Hardhat verify result:', stdout);
      }
    });
    
    // Method 3: Manual verification info
    console.log('\n--- Manual Verification Info ---');
    console.log('Contract Address:', contractAddress);
    console.log('Network: Monad Testnet (Chain ID: 10143)');
    console.log('Compiler Version:', artifact.metadata?.compiler?.version || 'Unknown');
    console.log('Contract Name: NFTCollection');
    console.log('Constructor Arguments:', constructorArgs);
    console.log('\nManual verification URL:');
    console.log(`https://testnet.monadexplorer.com/address/${contractAddress}#code`);
    
    console.log('\nContract Source Code:');
    console.log('='.repeat(50));
    console.log(contractSource.substring(0, 500) + '...');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Usage: node scripts/verify-contract.js <contract_address>
const contractAddress = process.argv[2];

if (!contractAddress) {
  console.error('Usage: node scripts/verify-contract.js <contract_address>');
  process.exit(1);
}

verifyContract(contractAddress);