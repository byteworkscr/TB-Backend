import prisma from "../config/prisma";

class CreditScoreRepository {
  /**
   * Inserts or updates the reputation score of a user.
   *
   * @param {string} userId - The ID of the user.
   * @param {number} score - The calculated reputation score.
   * @returns {Promise<void>} No return value.
   */
  async upsertCreditScore(userId: string, score: number): Promise<void> {
    await prisma.reputation.upsert({
      where: { userId },
      update: { reputationScore: score, lastUpdated: new Date() },
      create: { 
        userId, 
        reputationScore: score, 
        lastUpdated: new Date(),
        trend: "stable" 
      },
    });
  }
}  

export default new CreditScoreRepository();
