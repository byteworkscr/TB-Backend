import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { generateToken } from "../middleware/auth.middleware";
import crypto from 'crypto';
import {Context, CreateUserInput, UpdateUserInput} from "../../models/user";
import {Validator} from "../../utils/input-validation-util";

const prisma = new PrismaClient();



export const userResolvers = {
    Query: {
        getUser: async (_parent: unknown, { id }: { id: string }, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findUnique({
                where: { id },
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        getCurrentUser: async (_parent: unknown, _args: unknown, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        getAllUsers: async (_parent: unknown, _args: unknown, { user }: Context) => {
            if (!user) throw new GraphQLError('Unauthorized');
            return prisma.user.findMany({
                include: {
                    roles: {
                        include: { role: true }
                    }
                }
            });
        }
    },
    Mutation: {

        registerUser: async (_parent: unknown, { input }: { input: CreateUserInput }) => {
            // Validate input first
            Validator.validateUserInput(input);

            const { name, email, password, walletAddress, roleIds } = input;

            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { walletAddress }
                    ]
                }
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    throw new GraphQLError('User with this email already exists');
                }
                if (existingUser.walletAddress === walletAddress) {
                    throw new GraphQLError('Wallet address is already in use');
                }
            }

            // Ensure a default USER role exists
            let defaultUserRole = await prisma.role.findUnique({
                where: { name: 'USER' }
            });

            if (!defaultUserRole) {
                defaultUserRole = await prisma.role.create({
                    data: {
                        name: 'USER'
                    }
                });
            }

            // Determine final role IDs
            let finalRoleIds: string[] = roleIds.length > 0
                ? roleIds
                : [defaultUserRole.id];

            // Validate and fetch roles
            const roles = await prisma.role.findMany({
                where: {
                    id: { in: finalRoleIds }
                }
            });

            // If no valid roles found, use the default USER role
            if (roles.length === 0) {
                roles.push(defaultUserRole);
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate a nonce
            const nonce = crypto.randomBytes(16).toString('hex');

            // Create user with roles
            // const user = await prisma.user.create({
            //     data: {
            //         name,
            //         email,
            //         password: hashedPassword,
            //         walletAddress,
            //         nonce,
            //         roles: {
            //             create: roles.map((role) => ({
            //                 role: { connect: { id: role.id } }
            //             }))
            //         }
            //     },
            //     include: {
            //         roles: {
            //             include: { role: true }
            //         }
            //     }
            // });
            
            const user = await prisma.user.create({
                data: {
                  name,
                  email,
                  password: hashedPassword,
                  walletAddress,
                  nonce,
                  lastLogin: new Date(), // Explicitly setting lastLogin
                  roles: {
                    create: roles.map((role) => ({
                      role: { connect: { id: role.id } },
                    })),
                  },
                },
                include: {
                  roles: {
                    include: { role: true },
                  },
                },
              });
              
            // Generate tokens
            const token = generateToken(user);
            const refreshToken = generateToken(user, true);

            return { user, token, refreshToken };
        },


        loginUser: async (_parent: unknown, { email, password }: { email: string, password: string }) => {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    roles: {
                        include: { role: true }
                    }
                }
            });

            if (!user) {
                throw new GraphQLError('Invalid credentials');
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new GraphQLError('Invalid credentials');
            }

            // Generate tokens
            const token = generateToken(user);
            const refreshToken = generateToken(user, true);

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            return { user, token, refreshToken };
        },
        updateUser: async (_parent: unknown, { id, input }: { id: string, input: UpdateUserInput }, { user }: Context) => {
            if (!user || user.id !== id) {
                throw new GraphQLError('Unauthorized');
            }

            return prisma.user.update({
                where: { id },
                data: input,
                include: {
                    roles: {
                        include: { role: true }
                    },
                    loans: true,
                    reputation: true
                }
            });
        },
        deleteUser: async (_parent: unknown, { id }: { id: string }, { user }: Context) => {
            if (!user || user.id !== id) {
                throw new GraphQLError('Unauthorized');
            }

            await prisma.user.delete({ where: { id } });
            return true;
        }
    }
};