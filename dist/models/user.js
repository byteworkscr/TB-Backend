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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLastLogin = exports.updateUserNonce = exports.createUser = exports.findUserByWalletAddress = exports.users = void 0;
exports.generateNonce = generateNonce;
// In-memory store for users (replace with database in production)
exports.users = [];
// Keep track of last used nonce timestamp to ensure uniqueness
let lastNonceTimestamp = 0;
// Generate a unique nonce
function generateNonce() {
    return __awaiter(this, void 0, void 0, function* () {
        // Add a small delay to ensure unique timestamps
        yield new Promise(resolve => setTimeout(resolve, 1));
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const microseconds = process.hrtime()[1];
        return `${timestamp}-${microseconds}-${random}`;
    });
}
const findUserByWalletAddress = (walletAddress) => {
    return exports.users.find(user => user.walletAddress === walletAddress);
};
exports.findUserByWalletAddress = findUserByWalletAddress;
const createUser = (walletAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const user = {
        walletAddress,
        nonce: yield generateNonce(),
        createdAt: new Date()
    };
    exports.users.push(user);
    return user;
});
exports.createUser = createUser;
const updateUserNonce = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const newNonce = yield generateNonce();
    user.nonce = newNonce;
    return newNonce;
});
exports.updateUserNonce = updateUserNonce;
const updateLastLogin = (user) => {
    user.lastLogin = new Date();
};
exports.updateLastLogin = updateLastLogin;
