import prisma from "../config/prisma";
import CreditScoreRepository from "../repositories/creditScoreRepository";

class CreditScoreService {
  /**
   * Calculates the credit score for a user based on their loan and payment history.
   *
   * @param {string} userId - The ID of the user whose credit score is to be calculated.
   * @returns {Promise<number>} The calculated credit score for the user.
   *
   * - If the user does not exist, an error is thrown.
   * - The score is calculated based on:
   *   - Loan repayment history (35%)
   *   - On-time vs late payments (30%)
   *   - Reputation trends (20%)
   *   - Loan amount & completion (15%)
   * - The score is then stored/updated in the database.
   */
  async calculateCreditScore(userId: string): Promise<number> {
    // Check if user exists and retrieve relevant data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: { include: { payments: true } },
        reputation: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let score = 300; // Base score

    // Loan Repayment History (35%)
    const totalLoans = user.loans.length;
    const completedLoans = user.loans.filter((loan) => loan.status === "completed").length;
    if (totalLoans > 0) {
      score += (completedLoans / totalLoans) * 35 * 5;
    }

    // On-time vs Late Payments (30%)
    const allPayments = user.loans.flatMap((loan) => loan.payments);
    const totalPayments = allPayments.length;
    const latePayments = allPayments.filter((payment) => payment.status === "late").length;
    if (totalPayments > 0) {
      const onTimeRate = (totalPayments - latePayments) / totalPayments;
      score += onTimeRate * 30 * 5;
    }

    // Reputation Trends (20%)
    if (user.reputation) {
      score += (user.reputation.reputationScore / 100) * 20 * 5;
    }

    // Loan Amount & Completion (15%)
    const totalLoanAmount = user.loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
    const repaidLoanAmount = user.loans
      .filter((loan) => loan.status === "completed")
      .reduce((sum, loan) => sum + Number(loan.amount), 0);
    if (totalLoanAmount > 0) {
      score += (repaidLoanAmount / totalLoanAmount) * 15 * 5;
    }

    // Ensure score stays within range 300-850
    score = Math.min(850, Math.max(300, Math.round(score)));

    // Store or update the credit score
    await CreditScoreRepository.upsertCreditScore(userId, score);

    return score;
  }

  /**
   * Recalculates the credit score for all users in the database.
   *
   * @returns {Promise<void>} No return value.
   * - Iterates over all users and recalculates their credit scores.
   */
  async recalculateAllScores(): Promise<void> {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await this.calculateCreditScore(user.id);
    }
  }
}

export default new CreditScoreService();
