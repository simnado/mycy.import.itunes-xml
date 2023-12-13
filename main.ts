import { importItunesXml } from "./src/api.ts";
import { createSchema, createYoga } from "graphql-yoga";
import { serve } from "https://deno.land/std@0.157.0/http/server.ts";
import { convertItunesXml } from "./src/cli.ts";
import {a} from '@narendev/itunes-import'

console.log(a)

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      scalar File
      scalar Upload
      scalar Date

      type Library {
        iTunesVersion: String!
        snappedAt: Date!
        externalId: Date!
      }

      type Song {
        externalId: String!
        artist: String
        title: String!
        composer: String
        album: String
        genre: String
        duration: Int!
        disc: Int
        track: Int
        year: Int
        modifiedAt: Date!
        addedAt: Date!
        releaseDate: Date
      }

      type ImportResult {
        meta: Library!
        songs: [
          Song!
        ]!
      }

      type Query {
        status: String!
      }

      type Mutation {
        import(file: File!, modifiedSince: Date!): ImportResult!
      }
    `,
    resolvers: {
      Query: {
        status: () => "MyCy Import is running!",
      },
      Mutation: {
        import: async (_, payload: { file: File; modifiedSince: Date }) => {
          return importItunesXml(payload);
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

if (Deno.args.length === 0) {
  serve(yoga, {
    port: 8003,
    onListen({ hostname, port }) {
      console.log(
        `Listening on http://${hostname}:${port}/${yoga.graphqlEndpoint}`,
      );
    },
  });
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main && Deno.args.length) {
  const [mode, path, ...args] = Deno.args;

  if (mode !== "--cli" || !path) {
    console.error(
      "Invalid command. provide following arguments: --cli <path to xml file>",
    );
  } else {
    const file = await Deno.readFile(path);
    const fileBlob = new Blob([file], { type: "text/xml" });
    await convertItunesXml(fileBlob, args);
  }
}
