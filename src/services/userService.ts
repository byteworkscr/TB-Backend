import prisma from '../config/prisma';
import emailService from '../services/emailService';
import { NotificationType } from '@prisma/client';

interface UpdateProfileData {
  name?: string;
  email?: string;
  monthlyIncome?: number;
}

class UserService {
  async updateUserProfile(userId: string, data: UpdateProfileData) {
    // Get the current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      const error: any = new Error('User not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check if email is being changed
    const isEmailChanged = data.email && data.email !== currentUser.email;

    // Prepare the update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.monthlyIncome !== undefined) updateData.monthlyIncome = data.monthlyIncome;
    
    // If email is changing, set verification to false
    if (isEmailChanged) {
      updateData.email = data.email;
      updateData.emailVerified = false;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Send verification email if email has changed
    if (isEmailChanged && data.email) {
      await this.sendEmailVerification(data.email, updatedUser.name);
    }

    // Return the updated user (excluding sensitive information)
    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        monthlyIncome: updatedUser.monthlyIncome,
        emailVerified: updatedUser.emailVerified
      }
    };
  }

  private async sendEmailVerification(email: string, userName: string) {
    // Generate a verification token (in a real app, you'd save this with an expiry)
    const verificationToken = Math.random().toString(36).substring(2, 15);
    
    // In a real application, you would save this token and its expiry in the database
    // For simplicity, we're just sending the email here
    
    const verificationMessage = `Please verify your new email address by clicking on this link: 
    ${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await emailService.sendEmail(
      email,
      userName,
      NotificationType.SYSTEM_ALERT,
      verificationMessage
    );
  }
}

export default new UserService();