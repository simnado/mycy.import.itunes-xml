import { ITunesParser } from "@narendev/itunes-import";
import { fromEvent } from "npm:rxjs";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const path =
    "/home/narendorf/Code/mycy.import.itunes-xml/dist/Mediathek_7.9.23.xml";
  const file = await Deno.readFile(path);
  const fileBlob = new Blob([file], { type: "text/xml" });
  const parser = new ITunesParser();

  const meta$ = fromEvent(parser, "meta");
  meta$.subscribe((meta) => console.log(meta));

  const res = await parser.processFile(fileBlob);
  console.log(res);
  //await Deno.writeTextFile("./dist/dump.json", JSON.stringify(res, null, 2));
}
