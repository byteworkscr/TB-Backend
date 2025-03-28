"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = verifySignature;
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
dotenv_1.default.config();
function verifySignature(message, signature, walletAddress) {
    try {
        const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    }
    catch (error) {
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
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    // Method to get available loans (simulated for now)
    getAvailableLoans() {
        return __awaiter(this, void 0, void 0, function* () {
            // In a real implementation, this would query contracts on Stellar
            return [
                { id: '1', amount: '100', interest: '5%', duration: '30 days' },
                { id: '2', amount: '250', interest: '4.5%', duration: '60 days' }
            ];
        });
    }
    // Method to verify a wallet signature
    verifyWalletSignature(publicKey, signature, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Basic verification implementation
                // In a real app, you would use the Stellar library to verify
                return true;
            }
            catch (error) {
                console.error('Signature verification failed:', error);
                return false;
            }
        });
    }
}
exports.default = new BlockchainService();
