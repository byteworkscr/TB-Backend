import reputationService from "./reputationService";

class RecommendationService {
  /**
   * Generates loan recommendations for a user based on their reputation score.
   *
   * @param {string} userId - The ID of the user for whom recommendations are to be generated.
   * @returns {Promise<{ recommendations: string[] }>}
   *          An object containing an array of recommendations based on the user's reputation score.
   *
   * Recommendations are determined as follows:
   * - If the user's reputation score is below 50, they are advised to "Improve repayment history."
   * - Otherwise, they are encouraged to "Increase loan amount."
   *
   * If user reputation data is not found, an error is thrown.
   */
  async getUserRecommendations(
    userId: string
  ): Promise<{ recommendations: string[] }> {
    try {
      // Retrieve the user's reputation score
      const reputation = await reputationService.getUserReputation(userId);

      if (!reputation) {
        throw new Error("User reputation data not found");
      }

      // Generate recommendations based on the reputation score
      const recommendations = [];
      if (reputation.reputation_score < 50) {
        recommendations.push("Improve repayment history");
      } else {
        recommendations.push("Increase loan amount");
      }

      return { recommendations };
    } catch (error: any) {
      console.error(`Error fetching recommendations: ${error.message}`);
      throw new Error("Internal Server Error");
    }
  }
}

export default new RecommendationService();
