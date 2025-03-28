import { GraphQLError } from "graphql";
import { CreateUserInput } from "../models/user";

export class Validator {
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    static validateWalletAddress(address: string): boolean {
        const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return walletAddressRegex.test(address);
    }

    static validateUserInput(input: CreateUserInput): void {
        if (!input.email) {
            throw new GraphQLError('Email is required');
        }
        if (!this.validateEmail(input.email)) {
            throw new GraphQLError('Invalid email format');
        }

        if (!input.password) {
            throw new GraphQLError('Password is required');
        }
        if (!this.validatePassword(input.password)) {
            throw new GraphQLError('Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character');
        }

        if (!input.name || input.name.trim().length < 2) {
            throw new GraphQLError('Name must be at least 2 characters long');
        }

        if (!input.walletAddress) {
            throw new GraphQLError('Wallet address is required');
        }
        if (!this.validateWalletAddress(input.walletAddress)) {
            throw new GraphQLError('Invalid wallet address format');
        }
    }
}
