import { ethers } from 'ethers';

const TEST_PRIVATE_KEY = '0123456789012345678901234567890123456789012345678901234567890123';
const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);

// Replace this with the nonce you received
const nonce = process.argv[2] || "REPLACE_WITH_YOUR_NONCE";
const message = `Sign this message to authenticate with TrustBridge: ${nonce}`;

async function generateSignature() {
    const signature = await wallet.signMessage(message);
    console.log('Wallet Address:', wallet.address);
    console.log('Message:', message);
    console.log('Signature:', signature);
}

generateSignature().catch(console.error); 