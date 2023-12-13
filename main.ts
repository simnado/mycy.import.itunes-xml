import { ITunesParser } from "@narendev/itunes-import";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const path =
    "/home/narendorf/Code/mycy.import.itunes-xml/dist/Mediathek_7.9.23.xml";
  const file = await Deno.readFile(path);
  const fileBlob = new Blob([file], { type: "text/xml" });
  const parser = new ITunesParser();

  parser.on("meta", (meta) => console.log(meta));
  parser.on("playlist", (playlist) => {
    if (!playlist["Playlist Persistent ID"]) {
      console.log(playlist);
    }
  });
  parser.on("track", (track) => {
    if (false) {
      console.log(track);
    }
  });
  parser.on("playlistTrack", (track) => {
    if (track["Playlist Persistent ID"] && false) {
      console.log(track);
    }
  });

  const res = await parser.processFile(fileBlob);
  console.log(res);
  //await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
}
