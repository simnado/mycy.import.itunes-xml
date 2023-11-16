import { ItunesParser } from "./itunes/parser.ts";
import { DumpDriver } from "./itunes/drivers/dump.driver.ts";
import { StatisticsDriver } from "./itunes/drivers/statistics.driver.ts";
import { SongUpdatesDriver } from "./itunes/drivers/updates.driver.ts";

export async function convertItunesXml(file: Blob, flags: string[] = []) {
  if (flags.includes("--updates")) {
    const driver = new SongUpdatesDriver(new Date("2023"));
    const res = await driver.processFile(file);
    await Deno.writeTextFile("./dist/songs.json", JSON.stringify(res, null, 2));
  } else if (flags.includes("--dump")) {
    const dumpDriver = new DumpDriver();
    const res = await dumpDriver.processFile(file);
    await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
  } else if (flags.includes("--stats")) {
    const dumpDriver = new StatisticsDriver();
    const res = await dumpDriver.processFile(file);
    await Deno.writeTextFile("./dist/stats.json", JSON.stringify(res, null, 2));
  }
}
