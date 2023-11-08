import { ItunesParser } from "./itunes/parser.ts";

export async function importItunesXml(file: File) {
  // create a pull parser instance
  const parser = new ItunesParser();
  const res: any = await parser.processFile(file);

  return {
    fileName: file.name,
    fileSize: file.size,
    songs: Object.keys(res.root?.Tracks ?? {}).length,
  };
}
