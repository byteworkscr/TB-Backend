import RecommendationService from "../../src/services/recommendationService";
import reputationService from "../../src/services/reputationService";

// Mock the reputationService
jest.mock("../../src/services/reputationService", () => ({
  getUserReputation: jest.fn(),
}));

describe("RecommendationService.getUserRecommendations", () => {
  const userId = "test-user";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should recommend improving repayment history if reputation score is below 50", async () => {
    (reputationService.getUserReputation as jest.Mock).mockResolvedValue({ reputation_score: 40 });

    const result = await RecommendationService.getUserRecommendations(userId);

    expect(result).toEqual({ recommendations: ["Improve repayment history"] });
  });

  it("should recommend increasing loan amount if reputation score is 50 or above", async () => {
    (reputationService.getUserReputation as jest.Mock).mockResolvedValue({ reputation_score: 60 });

    const result = await RecommendationService.getUserRecommendations(userId);

    expect(result).toEqual({ recommendations: ["Increase loan amount"] });
  });

  it("should throw an error if reputation data is missing", async () => {
    (reputationService.getUserReputation as jest.Mock).mockResolvedValue(null);

    await expect(RecommendationService.getUserRecommendations(userId)).rejects.toThrow(
      "Internal Server Error"
    );
  });

  it("should handle errors gracefully", async () => {
    (reputationService.getUserReputation as jest.Mock).mockRejectedValue(new Error("Some error"));

    await expect(RecommendationService.getUserRecommendations(userId)).rejects.toThrow(
      "Internal Server Error"
    );
  });
});
