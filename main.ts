import { ITunesParser } from "@narendev/itunes-import";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const path =
    "/home/narendorf/Code/mycy.import.itunes-xml/dist/Mediathek_7.9.23.xml";
  const file = await Deno.readFile(path);
  const fileBlob = new Blob([file], { type: "text/xml" });
  const parser = new ITunesParser();

  parser.on("meta", (meta) => console.log(meta));
  //parser.on("playlist", (playlist) => console.log(playlist));
  parser.on("track", (track) => {
    if (track["Volume Adjustment"]) {
      console.log(track);
    }
  });
  parser.on("playlistTrack", (track) => {
    if (track["Track ID"] === 31537) {
      console.log(track);
    }
  });

  const res = await parser.processFile(fileBlob);
  console.log(res);
  //await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
}
