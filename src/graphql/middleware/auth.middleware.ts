import jwt from 'jsonwebtoken';

// Define interfaces for better type safety
interface UserPayload {
    id: string;
    email: string;
    roles: string[];
}

interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    resetToken: string | null;
    walletAddress: string;
    nonce: string;
    createdAt: Date;
    lastLogin: Date | null;
    updatedAt: Date;
    roles: Array<{ role: { id: string } }>;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'your_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'your_jwt_refresh_secret';

export function generateToken(user: User, isRefreshToken = false): string {
    const payload: UserPayload = {
        id: user.id,
        email: user.email,
        roles: user.roles.map((roleUser) => roleUser.role.id)
    };

    return jwt.sign(
        payload,
        isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET,
        {
            expiresIn: isRefreshToken ? '7d' : '1h'
        }
    );
}

export function verifyToken(token: string, isRefreshToken = false): UserPayload {
    try {
        return jwt.verify(
            token,
            isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET
        ) as UserPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}