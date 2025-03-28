import { Loan, Payment } from "@prisma/client";
import prisma from "../config/prisma";
import CreditScoreRepository from "../repositories/CreditScoreRepository";


class CreditScoreService {
  private creditScoreRepository = CreditScoreRepository;

  async calculateCreditScore(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: { include: { payments: true } },
        reputation: true,
      },
    });

    if (!user) throw new Error("User not found");

    let score = 300; // Base score

    type ExtendedLoan = Loan & { payments: Payment[] };

    // Loan Repayment History (35%)
    const totalLoans = user.loans.length;
    const completedLoans = user.loans.filter((loan: ExtendedLoan) => loan.status === "completed").length;
    if (totalLoans > 0) {
      score += (completedLoans / totalLoans) * 35 * 5; // Scale factor
    }

    // On-time vs Late Payments (30%)
    const totalPayments = user.loans.flatMap((loan: ExtendedLoan) => loan.payments).length;
    const latePayments = user.loans.flatMap((loan: ExtendedLoan) => loan.payments).filter((p) => p.status === "late").length;
    if (totalPayments > 0) {
      const onTimeRate = (totalPayments - latePayments) / totalPayments;
      score += onTimeRate * 30 * 5;
    }

    // Reputation Trends (20%)
    if (user.reputation) {
      score += (user.reputation.reputationScore / 100) * 20 * 5;
    }

    // Loan Amount & Completion (15%)
    const totalLoanAmount = user.loans.reduce((sum, loan: ExtendedLoan) => sum + Number(loan.amount), 0);
    const repaidLoanAmount = user.loans
      .filter((loan: ExtendedLoan) => loan.status === "completed")
      .reduce((sum, loan: ExtendedLoan) => sum + Number(loan.amount), 0);

    if (totalLoanAmount > 0) {
      score += (repaidLoanAmount / totalLoanAmount) * 15 * 5;
    }

    // Ensure score is within range
    score = Math.min(850, Math.max(300, Math.round(score)));

    // Save score using repository
    await this.creditScoreRepository.upsertCreditScore(userId, score);

    return score;
  }

  async recalculateAllScores() {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await this.calculateCreditScore(user.id);
    }
  }
}

export default new CreditScoreService();

// Score Range	Rating
// 300 - 579	Poor	
// 580 - 669	Fair	
// 670 - 739	Good
// 740 - 799	Very Good	
// 800 - 850	Excellent	