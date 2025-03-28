import { PrismaClient } from '@prisma/client';
import {userResolvers} from "../src/graphql/resolvers/user.resolver";

const prisma = new PrismaClient();

describe('User Resolvers', () => {
    const defaultUserRoleIdPromise = (async () => {
        // Ensure default roles exist
        const userRole = await prisma.role.findUnique({
            where: { name: 'USER' }
        }) ?? await prisma.role.create({
            data: { name: 'USER' }
        });

        return userRole.id;
    })();

    test('registerUser should create a new user', async () => {
        const defaultUserRoleId = await defaultUserRoleIdPromise;

        const input = {
            name: 'Test User',
            email: 'test@example1.com',
            password: 'password1231',
            walletAddress: '0x123456779',
            roleIds: [defaultUserRoleId]
        };

        const result = await userResolvers.Mutation.registerUser(null, { input });

        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(input.email);
        expect(result.user.roles).toHaveLength(1);
        expect(result.token).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.user.deleteMany();
        await prisma.role.deleteMany({ where: { name: 'USER' } });
    });
});