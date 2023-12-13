import { ItunesParser } from "../parser.ts";
export abstract class Driver<T> {
  protected parser = new ItunesParser();

  abstract processFile(file: Blob): Promise<T>;
}
