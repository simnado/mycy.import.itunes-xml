// import { parse } from "https://deno.land/x/xml/mod.ts"
// import {parse} from "https://deno.land/x/ts_xml_parser/mod.ts"

import { ItunesParser } from "./src/itunes/parser copy.ts";

const inputFile = "./import/Mediathek.22.09.03.xml";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  // create a pull parser instance
  const parser = new ItunesParser();
  const res = await parser.processFile(inputFile);

  await Deno.writeTextFile("./data/out.json", JSON.stringify(res, null, 2));
}
