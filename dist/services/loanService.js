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
const loanRepository_1 = __importDefault(require("../repositories/loanRepository"));
class LoanService {
    /**
     * Retrieves a user's loan history and categorizes loans as active or completed.
     *
     * @param {string} userId - The ID of the user whose loan history is to be retrieved.
     * @returns {Promise<{ active_loans: any[], completed_loans: any[], message?: string }>}
     *          An object containing the user's loans categorized into:
     *          - `active_loans`: Loans that are still active.
     *          - `completed_loans`: Loans that have been fully repaid.
     *          - If no loans are found, a message is returned instead.
     *
     * - If the user does not exist, an error is thrown.
     * - If no loans are found, an empty list is returned for both `active_loans` and `completed_loans`.
     */
    getUserLoans(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if the user exists
            const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error("User not found");
            }
            // Retrieve the user's loan history
            const loans = yield loanRepository_1.default.getLoansByUserId(userId);
            // If no loans are found, return a message with empty arrays
            if (loans.length === 0) {
                return {
                    message: "No loans found for this user.",
                    active_loans: [],
                    completed_loans: []
                };
            }
            return {
                active_loans: loans.filter(loan => loan.status === "active"),
                completed_loans: loans.filter(loan => loan.status === "completed"),
            };
        });
    }
}
exports.default = new LoanService();
