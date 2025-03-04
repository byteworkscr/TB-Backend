import { Prisma, PrismaClient } from "@prisma/client";
import CreditScoreService from "../services/creditScoreService";

const prisma = new PrismaClient();
/**
 * Type definition for Prisma middleware parameters.
 * This ensures proper type safety for the middleware functions.
 */
type MiddlewareParams = {
  model?: string;
  action: string;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};


/**
 * Middleware hook to update the credit score when a related action occurs.
 * This function recalculates a user's credit score when a payment, reputation, or loan record is created or updated.
 */
export async function creditScoreTrigger() {
  console.log("Initializing credit score update triggers...");

  prisma.$use(async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<any>) => {
    const result = await next(params);

    // Check if the action is either "create" or "update" and applies to specific models
    if (["create", "update"].includes(params.action) && ["Payment", "Reputation", "Loan"].includes(params.model!)) {
      // Clone the arguments to avoid modifying Prisma's internal structures
      const argsCopy = JSON.parse(JSON.stringify(params.args));
      const userId = argsCopy?.data?.userId || argsCopy?.where?.userId;

      // If a userId is found, update their credit score
      if (userId) {
        console.log(`Updating credit score for user: ${userId}`);
        await CreditScoreService.calculateCreditScore(userId);
      }
    }

    return result;
  });
}
