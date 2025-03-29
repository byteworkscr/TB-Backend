import { Request, Response } from "express";
import LoanService from "../services/loanService";
import paymentService from "../services/paymentService";
import reputationService from "../services/reputationService";
import recommendationService from "../services/recommendationService";
import { IRecommendation } from "../interfaces";
/**
 * Controller for handling user analytics-related requests, including loans, payments, reputation, and recommendations.
 */
class AnalyticsController {
  /**
   * Retrieves a user's loan history.
   *
   * @param {Request} req - The Express request object containing `userId` in the request parameters.
   * @param {Response} res - The Express response object used to send back the loan data.
   * @returns {Promise<void>} Responds with the user's loan history in JSON format.
   */
  async getUserLoans(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const data = await LoanService.getUserLoans(userId);
    res.json(data);
  }

  /**
   * Retrieves a user's payment history.
   *
   * @param {Request} req - The Express request object containing `user_id` in the request parameters.
   * @param {Response} res - The Express response object used to send back the payment data.
   * @returns {Promise<void>} Responds with the user's payment history in JSON format.
   */
  async getUserPayments(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const data = await paymentService.getUserPayments(user_id);
    res.json(data);
  }

  /**
   * Retrieves a user's reputation score based on their loan and payment history.
   *
   * @param {Request} req - The Express request object containing `user_id` in the request parameters.
   * @param {Response} res - The Express response object used to send back the reputation data.
   * @returns {Promise<void>} Responds with the user's reputation score in JSON format.
   */
  async getUserReputation(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const data = await reputationService.getUserReputation(user_id);
    res.json(data);
  }

  /**
   * Retrieves loan recommendations for a user based on their reputation score.
   *
   * @param {Request} req - The Express request object containing `user_id` in the request parameters.
   * @param {Response} res - The Express response object used to send back the recommendations.
   * @returns {Promise<void>} Responds with the user's recommendations in JSON format.
   */
  async getUserRecommendations(req: Request, res: Response): Promise<void> {
    const { user_id } = req.params;
    const data = await recommendationService.getUserRecommendations(user_id);
    res.json(data);
  }
}

export default new AnalyticsController();
