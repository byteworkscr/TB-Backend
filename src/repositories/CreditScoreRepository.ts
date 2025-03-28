import prisma from "../config/prisma";

class CreditScoreRepository {
  async upsertCreditScore(userId: string, score: number): Promise<void> {
    await prisma.creditScore.upsert({
      where: { userId },
      update: { score, lastUpdated: new Date() },
      create: { userId, score, lastUpdated: new Date() },
    });
  }

  async getUserCreditScore(userId: string): Promise<number | null> {
    const creditScore = await prisma.creditScore.findUnique({ where: { userId } });
    return creditScore ? creditScore.score : null;
  }
}

export default new CreditScoreRepository();
