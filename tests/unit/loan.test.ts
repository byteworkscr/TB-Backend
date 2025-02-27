import LoanService from "../../src/services/loanService";
import prisma from "../../src/config/prisma"; // Ensure correct import path
import LoanRepository from "../../src/repositories/loanRepository";

jest.mock("../../src/config/prisma", () => ({
  __esModule: true, // ✅ Fix ES module default export
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../src/repositories/loanRepository", () => ({
  getLoansByUserId: jest.fn(),
}));

describe("LoanService.getUserLoans", () => {
  const userId = "test-user";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if user does not exist", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(LoanService.getUserLoans(userId)).rejects.toThrow("User not found");
  });

  it("should return empty lists if no loans are found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    (LoanRepository.getLoansByUserId as jest.Mock).mockResolvedValue([]);

    const result = await LoanService.getUserLoans(userId);

    expect(result).toEqual({
      message: "No loans found for this user.",
      active_loans: [],
      completed_loans: [],
    });
  });

  it("should separate active and completed loans correctly", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
    (LoanRepository.getLoansByUserId as jest.Mock).mockResolvedValue([
      { id: "loan1", status: "active" },
      { id: "loan2", status: "completed" },
      { id: "loan3", status: "active" },
    ]);

    const result = await LoanService.getUserLoans(userId);

    expect(result).toEqual({
      active_loans: [{ id: "loan1", status: "active" }, { id: "loan3", status: "active" }],
      completed_loans: [{ id: "loan2", status: "completed" }],
    });
  });

  it("should handle unexpected errors gracefully", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

    await expect(LoanService.getUserLoans(userId)).rejects.toThrow("Database error");
  });
});
