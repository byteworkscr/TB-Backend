import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class TokenCleanupService {
  constructor() {
    this.startTokenCleanupJob();
  }

  async cleanExpiredTokens() {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() }, 
        },
      });
      console.log(`✅ Deleted ${result.count} expired tokens.`);
    } catch (error) {
      console.error("❌ Error cleaning expired tokens:", error);
    }
  }

  startTokenCleanupJob() {
    console.log("🕒 Starting token cleanup job...");
    
    setInterval(() => this.cleanExpiredTokens(), 3600000);
  }
}

// Initialize the service
const tokenCleanupService = new TokenCleanupService();
export default tokenCleanupService;
