import prisma from "../../src/config/prisma";
import CreditScoreService from "../../src/services/creditScoreService";

jest.mock("../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    creditScore: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
  },
}));

describe("CreditScoreService", () => {
  const userId = "test-user";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if user not found when calculating credit score", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(CreditScoreService.calculateCreditScore(userId))
      .rejects
      .toThrow("User not found");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      include: {
        loans: { include: { payments: true } },
        reputation: true,
      },
    });
  });

  it("should calculate credit score based on loan repayment history", async () => {
    const mockUser = {
      id: userId,
      loans: [
        { id: "loan-1", status: "completed", amount: 1000, payments: [] },
        { id: "loan-2", status: "pending", amount: 2000, payments: [] },
      ],
      reputation: { reputationScore: 70 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThanOrEqual(850);
  });

  it("should calculate credit score considering on-time and late payments", async () => {
    const mockUser = {
      id: userId,
      loans: [
        {
          id: "loan-1",
          status: "completed",
          amount: 1000,
          payments: [
            { status: "on-time" },
            { status: "late" },
          ],
        },
        {
          id: "loan-2",
          status: "pending",
          amount: 2000,
          payments: [{ status: "on-time" }],
        },
      ],
      reputation: { reputationScore: 50 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThanOrEqual(850);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      include: {
        loans: { include: { payments: true } },
        reputation: true,
      },
    });
  });

  it("should adjust score based on reputation trends", async () => {
    const mockUser = {
      id: userId,
      loans: [],
      reputation: { reputationScore: 90 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThanOrEqual(850);
  });

  it("should adjust score based on loan amount and completion", async () => {
    const mockUser = {
      id: userId,
      loans: [
        { id: "loan-1", status: "completed", amount: 1000, payments: [] },
        { id: "loan-2", status: "completed", amount: 500, payments: [] },
        { id: "loan-3", status: "pending", amount: 2000, payments: [] },
      ],
      reputation: { reputationScore: 60 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThanOrEqual(850);
  });

  it("should cap score to a maximum of 850", async () => {
    const mockUser = {
      id: userId,
      loans: [
        { id: "loan-1", status: "completed", amount: 1000, payments: [] },
        { id: "loan-2", status: "completed", amount: 2000, payments: [] },
      ],
      reputation: { reputationScore: 100 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeLessThanOrEqual(850);
  });

  it("should floor score to a minimum of 300", async () => {
    const mockUser = {
      id: userId,
      loans: [
        { id: "loan-1", status: "default", amount: 1000, payments: [{ status: "late" }] },
      ],
      reputation: { reputationScore: 10 },
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const score = await CreditScoreService.calculateCreditScore(userId);

    expect(score).toBeGreaterThanOrEqual(300);
  });

  it("should recalculate all scores successfully", async () => {
    const mockUsers = [{ id: "user-1" }, { id: "user-2" }];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const calculateCreditScoreSpy = jest.spyOn(CreditScoreService, "calculateCreditScore");

    await CreditScoreService.recalculateAllScores();

    expect(calculateCreditScoreSpy).toHaveBeenCalledTimes(mockUsers.length);
    expect(calculateCreditScoreSpy).toHaveBeenCalledWith("user-1");
    expect(calculateCreditScoreSpy).toHaveBeenCalledWith("user-2");
  });
});
