import { ItunesParser } from "./itunes/parser.ts";

export async function convertItunesXml(file: Blob) {
  // create a pull parser instance
  const parser = new ItunesParser();
  const res: any = await parser.processFile(file);

  await Deno.writeTextFile("./dist/out.json", JSON.stringify(res, null, 2));
}
