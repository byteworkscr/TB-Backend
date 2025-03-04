import {logAction} from "../services/auditService";
import { Prisma, PrismaClient } from "@prisma/client";

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
 * Middleware hook to log database actions related to payments and loans.
 * This function tracks and stores user actions when a payment or loan is created or updated.
 */
export async function auditTrigger() {
  console.log("Initializing log triggers...");

  prisma.$use(async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<any>) => {
    const result = await next(params);

    // Check if the action is either "create" or "update"
    if (["create", "update"].includes(params.action)) {
      // Clone the arguments to avoid modifying Prisma's internal structures
      const argsCopy = JSON.parse(JSON.stringify(params.args));
      let userId = null;

      // Extract userId from "Payment" and "Loan" models
      if (params.model === "Payment" || params.model === "Loan") {
        userId = argsCopy?.data?.userId || argsCopy?.where?.userId;
      }

      // If a userId is found, log the action
      if (userId) {
        console.log("Updating logger");
        await logAction(userId, `${params.action} ${params.model}`, JSON.stringify(argsCopy.data));
      }
    }

    return result;
  });

}

