import PaymentService from "../../src/services/paymentService";
import prisma from "../../src/config/prisma";
import PaymentRepository from "../../src/repositories/paymentRepository";

jest.mock("../../src/config/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../src/repositories/paymentRepository", () => ({
  getPaymentsByUserId: jest.fn(),
}));

describe("PaymentService.getUserPayments", () => {
  const userId = "test-user";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if user does not exist", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(PaymentService.getUserPayments(userId)).rejects.toThrow("User not found");
  });

  it("should return a message if no payments are found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    (PaymentRepository.getPaymentsByUserId as jest.Mock).mockResolvedValue([]);

    const result = await PaymentService.getUserPayments(userId);

    expect(result).toEqual({ message: "No payment history found for this user." });
  });

  it("should categorize on-time and late payments correctly", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    (PaymentRepository.getPaymentsByUserId as jest.Mock).mockResolvedValue([
      { id: "pay1", status: "on_time" },
      { id: "pay2", status: "late" },
      { id: "pay3", status: "on_time" },
    ]);

    const result = await PaymentService.getUserPayments(userId);

    expect(result).toEqual({
      payment_history: [
        { id: "pay1", status: "on_time" },
        { id: "pay2", status: "late" },
        { id: "pay3", status: "on_time" },
      ],
      on_time_payments: 2,
      late_payments: 1,
    });
  });

  it("should handle unexpected errors gracefully", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

    await expect(PaymentService.getUserPayments(userId)).rejects.toThrow("Database error");
  });
});
