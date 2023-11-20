import { SongUpdatesDriver } from "./itunes/drivers/updates.driver.ts";

export async function importItunesXml(
  payload: { file: File; modifiedSince: Date },
) {
  // create a pull parser instance
  const parser = new SongUpdatesDriver(payload.modifiedSince);
  const res = await parser.processFile(payload.file);

  return res;
}
