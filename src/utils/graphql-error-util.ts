import { GraphQLError, GraphQLErrorExtensions } from 'graphql';

class AppGraphQLError extends GraphQLError {
    constructor(
        message: string,
        options?: {
            code?: string;
            originalError?: Error;
        }
    ) {
        const extensions: GraphQLErrorExtensions = {
            code: options?.code ?? 'INTERNAL_SERVER_ERROR'
        };

        // @ts-ignore
        super(message, { extensions });

        // If an original error exists, attach it
        if (options?.originalError) {
            (this as any).originalError = options.originalError;
        }
    }
}

// Error formatting function
export const formatGraphQLError = (error: GraphQLError) => ({
    message: error.message,
    extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR'
    }
});

export { AppGraphQLError };
