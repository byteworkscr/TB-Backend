import prisma from "../config/prisma";
import PaymentRepository from "../repositories/paymentRepository";

class PaymentService {
  /**
   * Retrieves a user's payment history and calculates on-time and late payments.
   *
   * @param {string} userId - The ID of the user whose payment history is to be retrieved.
   * @returns {Promise<{ payment_history?: any[], on_time_payments?: number, late_payments?: number, message?: string }>}
   *          An object containing the user's payment history, the count of on-time payments, late payments,
   *          or a message if no payment history is found.
   *
   * - If the user does not exist, an error is thrown.
   * - If no payment records are found, a message is returned instead.
   * - Otherwise, the function returns:
   *   - `payment_history`: The list of payments made by the user.
   *   - `on_time_payments`: The count of payments made on time.
   *   - `late_payments`: The count of late payments.
   */
  async getUserPayments(userId: string): Promise<{
    payment_history?: any[];
    on_time_payments?: number;
    late_payments?: number;
    message?: string;
  }> {
    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Retrieve the user's payment history
    const payments = await PaymentRepository.getPaymentsByUserId(userId);

    // If no payments are found, return a message
    if (!payments.length) {
      return { message: "No payment history found for this user." };
    }

    // Calculate on-time and late payments
    const onTimePayments = payments.filter(
      (payment) => payment.status === "on_time"
    ).length;
    const latePayments = payments.filter(
      (payment) => payment.status === "late"
    ).length;

    return {
      payment_history: payments,
      on_time_payments: onTimePayments,
      late_payments: latePayments,
    };
  }
}

export default new PaymentService();
