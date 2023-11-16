import { ItunesParser } from "./itunes/parser.ts";
import { DumpDriver } from "./itunes/drivers/dump.driver.ts";

export async function convertItunesXml(file: Blob, flags: string[] = []) {
  if (flags.includes("--dump")) {
    const dumpDriver = new DumpDriver();
    const res = await dumpDriver.processFile(file);
    await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
  }
}
