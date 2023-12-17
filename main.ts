import { ITunesParser } from "@narendev/itunes-import";
import { fromEvent } from "npm:rxjs";
import { Database } from "@narendev/mycy-app";
import { load } from "https://deno.land/std@0.209.0/dotenv/mod.ts";
import {isc} from 'npm:itunes-search-client'

const res = await isc('foo').media('music').entity('song').
const json = await res.json()

await load({ export: true });

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const path =
    "/home/narendorf/Code/mycy.import.itunes-xml/dist/Mediathek_7.9.23.xml";
  const file = await Deno.readFile(path);
  const fileBlob = new Blob([file], { type: "text/xml" });
  const parser = new ITunesParser();
  const db = await Database.connect(Deno.env.get("MONGO_URL") as string);

  let trackProcessed = 0;
  parser.on("track", async (track) => {
    await db.upsertTrack({
      addedAt: track["Date Added"],
      albumTitle: track.Album,
      albumArtists: track["Album Artist"],
      artists: track.Artist,
      bitrate: track["Bit Rate"],
      cloudStatus: track["Apple Music"]
        ? "Apple Music"
        : track.Matched
        ? "Matched"
        : "Uploaded",
      contentRating: track.Clean
        ? "Clean"
        : track.Explicit
        ? "Explicit"
        : undefined,
      comments: track.Comments,
      composers: track.Composer,
      disc: track["Disc Number"],
      duration: track["Total Time"],
      fileFormat: track.Kind,
      fileSize: track.Size,
      gapless: track["Part Of Gapless Album"] ?? false,
      genre: track.Genre,
      likeFactor: track.Loved ? 1 : track.Disliked ? -1 : 0,
      modifiedAt: track["Date Modified"],
      normalization: track.Normalization,
      persistentId: track["Persistent ID"],
      playCount: track["Play Count"] ?? 0,
      rating: track.Rating,
      releaseDate: track["Release Date"],
      releaseYear: track.Year,
      sampleRate: track["Sample Rate"],
      skipCount: track["Skip Count"] ?? 0,
      title: track.Name,
      track: track["Track Number"],
      volumeAdjustment: track["Volume Adjustment"],
      work: track.Work,
    });
    trackProcessed += 1;
    if (trackProcessed % 100 === 0) {
      console.log(trackProcessed);
    }
  });

  const meta$ = fromEvent(parser, "meta");
  meta$.subscribe((meta) => console.log(meta));

  const res = await parser.processFile(fileBlob);
  console.log(res);
  //await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
}
