import { Request } from 'express';
import jwt from 'jsonwebtoken';

interface User {
    id: string;
    email: string;
}

export function generateContext({ req }: { req: Request }) {
    const context: { user?: User } = {};

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'your_jwt_secret') as User;
            context.user = {
                id: decoded.id,
                email: decoded.email
            };
        }
    } catch (error) {
        // Token verification failed, but we don't want to block the request
        console.log('Invalid token', error);
    }

    return context;
}