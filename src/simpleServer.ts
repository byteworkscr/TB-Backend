import { ApolloServer, gql } from "apollo-server";

const typeDefs = gql`
    type Query {
        hello: String
    }
`;

const resolvers = {
    Query: {
        hello: (): string => "Hello, GraphQL!",
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enables schema introspection
    formatError: (err) => {
        // Return only necessary error message
        return {
            message: err.message,
            extensions: {
                code: err.extensions?.code || "INTERNAL_SERVER_ERROR"
            }
        };
    }
});

// Start the server
server.listen().then(({ url }: { url: string }) => {
    console.log(`🚀 Server ready at ${url}`);
});
