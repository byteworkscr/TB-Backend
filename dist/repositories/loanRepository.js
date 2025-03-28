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
const prisma_1 = __importDefault(require("../config/prisma"));
class LoanRepository {
    /**
     * Retrieves a user's loan history, ordered by creation date in descending order.
     *
     * @param {string} userId - The ID of the user whose loan history is to be retrieved.
     * @returns {Promise<any[]>} A list of loans associated with the user, ordered from most recent to oldest.
     *
     * - This function queries the database for loans linked to the specified user.
     * - Loans are returned in descending order based on `createdAt` (most recent first).
     */
    getLoansByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.loan.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            });
        });
    }
}
exports.default = new LoanRepository();
