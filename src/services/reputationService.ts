import LoanService from "./loanService";
import PaymentService from "./paymentService";

class ReputationService {
  /**
   * Calculates and returns a user's reputation score based on their loan repayment history.
   *
   * @param {string} userId - The ID of the user whose reputation score is to be retrieved.
   * @returns {Promise<{ reputation_score: number, trend: string, message?: string }>}
   *          An object containing the user's reputation score, trend, and an optional message.
   *
   * The reputation score is calculated based on the ratio of on-time payments to total payments.
   * The trend is determined as follows:
   * - "increasing" if the repayment ratio is above 0.8
   * - "stable" if the repayment ratio is between 0.5 and 0.8
   * - "decreasing" if the repayment ratio is below 0.5
   *
   * If no completed loans are found, the function returns a score of 0 with a stable trend.
   * If payment data is unavailable, an error is thrown.
   */
  async getUserReputation(
    userId: string
  ): Promise<{ reputation_score: number; trend: string; message?: string }> {
    try {
      // Fetch the user's completed loan data
      const loansData = await LoanService.getUserLoans(userId);

      // If no completed loans exist, return a default reputation score
      if (
        !loansData.completed_loans ||
        loansData.completed_loans.length === 0
      ) {
        return {
          reputation_score: 0,
          trend: "stable",
          message: "No completed loans found.",
        };
      }

      // Fetch the user's payment history
      const paymentsData = await PaymentService.getUserPayments(userId);

      if (!paymentsData) {
        throw new Error("Payment data not found");
      }

      // Extract on-time and late payments, defaulting to 0 if undefined
      const { on_time_payments = 0, late_payments = 0 } = paymentsData;
      const totalPayments = on_time_payments + late_payments;

      // Calculate the repayment ratio (percentage of on-time payments)
      const repaymentRatio =
        totalPayments > 0 ? on_time_payments / totalPayments : 0;

      // Determine the repayment trend
      let trend = "stable";
      if (repaymentRatio > 0.8) trend = "increasing";
      else if (repaymentRatio < 0.5) trend = "decreasing";

      return {
        reputation_score: Math.round(repaymentRatio * 100), // Convert ratio to percentage
        trend,
      };
    } catch (error: any) {
      console.error(`Error fetching user reputation: ${error.message}`);
      throw new Error("Internal Server Error");
    }
  }
}

export default new ReputationService();
