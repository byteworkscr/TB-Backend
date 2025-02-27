import prisma from "../config/prisma";

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
  async getLoansByUserId(userId: string): Promise<any[]> {
    return prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new LoanRepository();
