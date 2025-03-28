import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRoles() {
    try {
        // Check if roles already exist to avoid duplicates
        const existingRoles = await prisma.role.findMany();

        if (existingRoles.length === 0) {
            const roles = [
                { name: 'USER' },
                { name: 'ADMIN' },
                { name: 'BORROWER' }
            ];

            await prisma.role.createMany({
                data: roles,
                skipDuplicates: true
            });

            console.log('Roles seeded successfully');
        } else {
            console.log('Roles already exist');
        }
    } catch (error) {
        console.error('Error seeding roles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// If this script is run directly
if (require.main === module) {
    seedRoles()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}

export default seedRoles;