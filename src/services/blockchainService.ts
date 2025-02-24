import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

export function verifySignature(message: string, signature: string, walletAddress: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

class BlockchainService {
  constructor() {
    // Initialize with test configuration
    console.log('BlockchainService initialized in test mode');
  }

  // Method to verify connection (simplified for testing)
  async testConnection() {
    return true;
  }

  // Method to get available loans (simulated for now)
  async getAvailableLoans() {
    // In a real implementation, this would query contracts on Stellar
    return [
      { id: '1', amount: '100', interest: '5%', duration: '30 days' },
      { id: '2', amount: '250', interest: '4.5%', duration: '60 days' }
    ];
  }

  // Method to verify a wallet signature
  async verifyWalletSignature(publicKey: string, signature: string, message: string) {
    try {
      // Basic verification implementation
      // In a real app, you would use the Stellar library to verify
      return true;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}

export default new BlockchainService();