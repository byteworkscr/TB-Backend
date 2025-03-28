import prisma from '../config/prisma';

export async function createUser(name: string, email: string, password: string, walletAddress: string, nonce: string) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        walletAddress, nonce,
        reputation: { create: { reputationScore: 50, trend: "neutral" } }, // Default reputation
        creditScore: { create: { score: 600 } }, // Default credit score
      },
      include: {
        reputation: true,
        creditScore: true,
      },
    });
  
    console.log("✅ User Created:");
    return user;
  }
  
  /**
   * Update user details
   */
  export async function updateUser(userId: string, newData: { name?: string; email?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: newData,
    });
  
    console.log("✅ User Updated:", user);
    return user;
  }
  
  /**
   * Create a new loan for a user
   */
  export async function createLoan(userId: string, amount: number, status: "ongoing" | "completed" | "defaulted") {
    const loan = await prisma.loan.create({
      data: {
        userId,
        amount,
        status,
      },
    });
  
    console.log("✅ Loan Created:");
    return loan;
  }
  
  /**
   * Record a payment for a loan
   */
  export async function makePayment(userId: string, loanId: string, amount: number, status: "paid" | "pending" | "late") {
    const payment = await prisma.payment.create({
      data: {
        userId,
        loanId,
        amount,
        status,
      },
    });
  
    console.log("✅ Payment Recorded:", payment);
  
    return payment;
  }
  
  /**
   * Update user reputation
   */
  export async function updateReputation(userId: string, reputationScore: number, trend: "improving" | "stable" | "declining") {
    const reputation = await prisma.reputation.update({
      where: { userId },
      data: {
        reputationScore,
        trend,
      },
    });
  
    console.log("✅ Reputation Updated:", reputation);
  
    return reputation;
  }
