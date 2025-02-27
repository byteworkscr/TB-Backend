import prisma from "../config/prisma";
import LoanRepository from "../repositories/loanRepository";

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
async getUserLoans(userId: string): Promise<{ 
    active_loans: any[], 
    completed_loans: any[], 
    message?: string 
}> {
    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }

    // Retrieve the user's loan history
    const loans = await LoanRepository.getLoansByUserId(userId);

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
}
}

export default new LoanService();
