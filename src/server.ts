import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { addResolversToSchema } from '@graphql-tools/schema';
import path from 'path';
import cors from 'cors';

import { userResolvers } from './graphql/resolvers/user.resolver';
import { generateContext } from './graphql/middleware/context.middleware'; // New context middleware

async function startServer() {
  const app: Application = express(); // ✅ Explicitly type as Application

  // Enable CORS for all routes
  app.use(cors({
    origin: '*', // Be more specific in production
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Parse JSON bodies
  app.use(express.json());

  // Load schema
  const schema = loadSchemaSync(path.join(__dirname, './graphql/schemas/**/*.graphql'), {
    loaders: [new GraphQLFileLoader()]
  });

  // Add resolvers
  const schemaWithResolvers = addResolversToSchema({
    schema,
    resolvers: {
      Query: {
        ...userResolvers.Query
      },
      Mutation: {
        ...userResolvers.Mutation
      }
    }
  });

  // Apollo Server setup
  const server = new ApolloServer({
    schema: schemaWithResolvers,
    context: generateContext, // Use a more robust context generation
    formatError: (err) => {
      // Return only necessary error message
      return {
        message: err.message,
        extensions: {
          code: err.extensions?.code || "INTERNAL_SERVER_ERROR"
        }
      };
    },
    introspection: true, // Enable for development/testing
  });

  await server.start();

  // Apply middleware with app instance
  server.applyMiddleware({
    app: app as any,
    path: '/graphql',
    cors: {
      origin: '*', // Be more specific in production
      credentials: true
    }
  });

  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(console.error);
