import { ItunesParser } from "./itunes/parser.ts";

export async function importItunesXml(file: File) {
  if (file.type !== "text/xml") {
    throw new Error("invalid file format");
  }
  console.log(file);
  // create a pull parser instance
  const parser = new ItunesParser();
  const res: any = await parser.processFile(file);

  //await Deno.writeTextFile("./data/out.json", JSON.stringify(res, null, 2));
  return {
    fileName: file.name,
    fileSize: file.size,
    songs: Object.keys(res.root?.Tracks ?? {}).length,
  };
}
