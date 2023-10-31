import { importItunesXml } from "./src/api.ts";
import { createSchema, createYoga } from "graphql-yoga";
import { serve } from "https://deno.land/std@0.157.0/http/server.ts";

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      scalar File
      scalar Upload

      type ImportResult {
        fileName: String!
        fileSize: Int!
        songs: Int!
      }

      type Query {
        status: String!
      }

      type Mutation {
        import(file: File!): ImportResult!
      }
    `,
    resolvers: {
      Query: {
        status: () => "MyCy Import is running!",
      },
      Mutation: {
        import: async (_, { file }: { file: File }) => {
          return importItunesXml(file);
        },
      },
    },
  }),
  graphiql: {
    defaultQuery: /* GraphQL */ `
      query {
        status
      }
    `,
  },
});

serve(yoga, {
  onListen({ hostname, port }) {
    console.log(
      `Listening on http://${hostname}:${port}/${yoga.graphqlEndpoint}`,
    );
  },
});
// TODO: configure
const inputFile = "./import/Mediathek-231030.xml";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
}
