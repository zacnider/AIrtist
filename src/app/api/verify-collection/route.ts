import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { transactionHash } = await request.json();

    if (!transactionHash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Processing transaction:', transactionHash);

    // Use the simple verify script to handle verification
    try {
      const verifyCommand = `node scripts/simple-verify.js ${transactionHash}`;
      
      console.log('Executing:', verifyCommand);
      
      const { stdout, stderr } = await execAsync(verifyCommand, {
        cwd: process.cwd(),
        timeout: 60000 // 1 minute timeout
      });

      console.log('Verification output:', stdout);
      if (stderr) {
        console.log('Verification stderr:', stderr);
      }

      // Parse the output to extract information
      const isVerified = stdout.includes('✅ Verification process initiated') ||
                        stdout.includes('✅ Contract was already verified');
      
      // Extract explorer URL from output
      const explorerMatch = stdout.match(/🔗 Explorer: (https:\/\/[^\s]+)/);
      const explorerUrl = explorerMatch ? explorerMatch[1] : `https://testnet.monadexplorer.com/tx/${transactionHash}`;
      
      // Extract note from output
      const noteMatch = stdout.match(/📝 Note: (.+)/);
      const note = noteMatch ? noteMatch[1] : 'Please check Monad Explorer for verification status';

      if (isVerified) {
        console.log('✅ Verification process initiated!');
        console.log('🔗 Explorer URL:', explorerUrl);

        return NextResponse.json({
          success: true,
          explorerUrl,
          verified: true,
          transactionHash,
          note,
          message: 'Verification process initiated successfully!'
        });
      } else {
        console.log('❌ Verification process failed');
        
        return NextResponse.json({
          success: false,
          error: 'Verification process failed',
          details: stdout,
          transactionHash
        });
      }
    } catch (verifyError: any) {
      console.error('Verification error:', verifyError);
      
      return NextResponse.json({
        success: false,
        error: 'Verification process failed',
        details: verifyError?.message || 'Unknown verification error',
        transactionHash
      });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process verification request',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');
  
  if (!contractAddress) {
    return NextResponse.json(
      { success: false, error: 'Contract address is required' },
      { status: 400 }
    );
  }

  try {
    // Check if contract is already verified
    const explorerUrl = `https://testnet.monadexplorer.com/contracts/partial_match/10143/${contractAddress}/`;
    
    return NextResponse.json({
      success: true,
      contractAddress,
      explorerUrl,
      message: 'Use POST method with transaction hash for automatic verification'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}