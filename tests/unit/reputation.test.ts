import ReputationService from "../../src/services/reputationService";
import LoanService from "../../src/services/loanService";
import PaymentService from "../../src/services/paymentService";

// Mock LoanService and PaymentService
jest.mock("../../src/services/loanService", () => ({
  getUserLoans: jest.fn(),
}));

jest.mock("../../src/services/paymentService", () => ({
  getUserPayments: jest.fn(),
}));

describe("ReputationService.getUserReputation", () => {
  const userId = "test-user";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return reputation score 0 and stable trend if no completed loans exist", async () => {
    (LoanService.getUserLoans as jest.Mock).mockResolvedValue({ completed_loans: [] });

    const result = await ReputationService.getUserReputation(userId);

    expect(result).toEqual({
      reputation_score: 0,
      trend: "stable",
      message: "No completed loans found.",
    });
  });

  it("should throw an error if payment data is not found", async () => {
    (LoanService.getUserLoans as jest.Mock).mockResolvedValue({ completed_loans: [1, 2] });
    (PaymentService.getUserPayments as jest.Mock).mockResolvedValue(null);

    await expect(ReputationService.getUserReputation(userId)).rejects.toThrow("Internal Server Error");
  });

  it("should return increasing trend if repayment ratio is above 0.8", async () => {
    (LoanService.getUserLoans as jest.Mock).mockResolvedValue({ completed_loans: [1, 2, 3] });
    (PaymentService.getUserPayments as jest.Mock).mockResolvedValue({
      on_time_payments: 9,
      late_payments: 1,
    });

    const result = await ReputationService.getUserReputation(userId);

    expect(result).toEqual({ reputation_score: 90, trend: "increasing" });
  });

  it("should return decreasing trend if repayment ratio is below 0.5", async () => {
    (LoanService.getUserLoans as jest.Mock).mockResolvedValue({ completed_loans: [1, 2, 3] });
    (PaymentService.getUserPayments as jest.Mock).mockResolvedValue({
      on_time_payments: 2,
      late_payments: 5,
    });

    const result = await ReputationService.getUserReputation(userId);

    expect(result).toEqual({ reputation_score: 29, trend: "decreasing" });
  });

  it("should return stable trend if repayment ratio is between 0.5 and 0.8", async () => {
    (LoanService.getUserLoans as jest.Mock).mockResolvedValue({ completed_loans: [1, 2, 3] });
    (PaymentService.getUserPayments as jest.Mock).mockResolvedValue({
      on_time_payments: 4,
      late_payments: 4,
    });

    const result = await ReputationService.getUserReputation(userId);

    expect(result).toEqual({ reputation_score: 50, trend: "stable" });
  });

  it("should handle errors gracefully", async () => {
    (LoanService.getUserLoans as jest.Mock).mockRejectedValue(new Error("Some error"));

    await expect(ReputationService.getUserReputation(userId)).rejects.toThrow("Internal Server Error");
  });
});
