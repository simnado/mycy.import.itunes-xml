import { serve } from "https://deno.land/std@0.157.0/http/server.ts";
import {a, ITunesParser} from '@narendev/itunes-import'

console.log(a)

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const exclusionFilter = new Map([
    ["Distinguished Kind", () => true],
    ["Folder", () => true],
    ["Master", () => true],
    ["Smart Criteria", () => true],
  ]);

  const fieldMappings = new Map([
    ["Album", "album"],
    ["Application Version", "iTunesVersion"],
    ["Artist", "artist"],
    ["Composer", "composer"],
    ["Date", "snappedAt"],
    ["Date Added", "addedAt"],
    ["Date Modified", "modifiedAt"],
    ["Disc Number", "disc"],
    ["Genre", "genre"],
    ["Library Persistent ID", "externalId"],
    ["Major Version", "majorVersion"],
    ["Minor Version", "minorVersion"],
    ["Name", "title"],
    ["Persistent ID", "externalId"],
    ["Playlist Persistent ID", "externalId"],
    ["Release Date", "releaseDate"],
    ["Total Time", "duration"],
    ["Track ID", "externalId"],
    ["Track Number", "track"],
    ["Work", "work"],
    ["Year", "year"],
  ]);

  const path = '/home/narendorf/Code/mycy.import.itunes-xml/dist/Mediathek_7.9.23.xml'
  const file = await Deno.readFile(path);
  const fileBlob = new Blob([file], { type: "text/xml" });
  const parser = new ITunesParser({fieldMappings, exclusionFilter})
  const res = await parser.processFile(fileBlob);
  await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
}
