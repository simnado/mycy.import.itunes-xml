import { PullParser } from "https://deno.land/x/xmlp/mod.ts";
import { ProvidedSong } from "../../types/models.ts";
import { iTunesLib, iTunesTrack } from "./model/itunes.ts";
import EventEmitter from "https://deno.land/x/events@v1.0.0/mod.ts";

type ParserEvent<T> = {
  namespace: string;
  value: T;
};

enum ParserStateType {
  String = "string",
  Data = "data",
  Integer = "integer",
  Date = "date",
  True = "true",
  False = "false",
  PList = "plist",
}

class ParserState {
  private keys: string[] = [];
  private type?: ParserStateType;
  private rawValue?: string;
  private path: string[] = [];
  private arrayIdx: number[] = [];

  reset() {
    this.keys = [];
    this.path = [];
    this.rawValue = undefined;
    this.type = undefined;
    this.arrayIdx = [];
  }

  addArray() {
    this.arrayIdx.push(0);
  }

  popArray() {
    this.arrayIdx.pop();
  }

  incrementArrayIdx() {
    this.arrayIdx[this.arrayIdx.length - 1] += 1;
  }

  addPath(path: string) {
    this.path.push(path);
  }

  popPath() {
    this.path.pop();
  }

  setType(type: ParserStateType) {
    this.type = type;
  }

  setValue(value: string) {
    this.rawValue = value;
  }

  addKey(key: string) {
    this.keys.push(key);
  }

  popKey() {
    this.keys.pop();
  }

  get currentIdx() {
    return this.arrayIdx.at(-1);
  }

  get currentElement() {
    return this.path.at(-1);
  }

  get value(): any {
    switch (this.type) {
      case ParserStateType.String:
      case ParserStateType.Data:
        return this.rawValue;
      case ParserStateType.Integer:
        return Number(this.rawValue);
      case ParserStateType.Date:
        return new Date(this.rawValue ?? 0);
      case ParserStateType.True:
        return true;
      case ParserStateType.False:
        return false;
      default:
        console.error("unknow type " + this.type);
        return null;
    }

    return null;
  }

  toString() {
    return `${this.keys.join(" > ")} : ${this.value}`;
  }

  toEvent() {
    return { key: this.keys, value: this.value };
  }
}

export class ItunesParser {
  state = new ParserState();

  async *parseFile(
    file: Blob,
  ): AsyncGenerator<{ key: string[]; value: any }> {
    if (file.type !== "text/xml") {
      throw new Error("invalid file format");
    }

    this.state.reset();
    const parser = new PullParser();

    // create an ES6 generator
    const arrBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrBuffer);
    const events = parser.parse(uint8Array);

    let i = 0;
    const start = new Date();

    for (const node of events) {
      const firstInArray = this.state.currentElement === "array";

      switch (node.name) {
        case "processing_instruction":
        case "doctype":
        case "start_document":
          break;
        case "start_element":
          switch (node.element?.qName) {
            case "plist":
              continue;
            case "dict":
              if (firstInArray) {
                this.state.addKey(String(this.state.currentIdx));
                this.state.incrementArrayIdx();
              }
              this.state.addPath(node.element.qName);
              break;
            case "array":
              this.state.addPath(node.element.qName);
              this.state.addArray();
              break;
            case "key":
              this.state.addPath(node.element.qName);
              break;
            default:
              this.state.setType(node.element?.qName as ParserStateType);
          }
          break;
        case "end_element":
          switch (node.element?.qName) {
            case "array":
              this.state.popArray();
              this.state.popPath();
              this.state.popKey();
              break;
            case "dict":
              this.state.popPath();
              this.state.popKey();
              break;
            case "key":
              this.state.popPath();
              break;
            case "true":
            case "false":
              this.state.setValue(node.element?.qName as string);
              yield this.state.toEvent();
              this.state.popKey();
              break;
            default:
              this.state.popKey();
          }
          break;
        case "text":
          switch (this.state.currentElement) {
            case "key":
              this.state.addKey(node.text as string);
              break;
            default:
              this.state.setValue(node.text as string);
              yield this.state.toEvent();
              break;
          }
          break;
        case "end_document":
          break;
        default:
          console.warn(`unknown node type "${node.name}"`);
      }

      i++;
    }

    const end = new Date();

    console.log(`processed ${i} lines in ${(end - start) / 1000} seconds`);
  }

  /*private postProcessDict(options: ParseOptions) {
    if (options.filterUpdatesSince) {
      // filter by modified date
      const dictDate = this.currentItem["Date Modified"];
      const isRelevant = dictDate &&
        (new Date(dictDate) > new Date(options.filterUpdatesSince));
      if (!isRelevant) {
        // delete
        delete this.currentItemParents.at(-1)[this.currentItem["Track ID"]];
        return;
      }
    }

    if (options.transform) {
      const oldKeys = Object.keys(this.currentItem);

      const currentItem = this.currentItem as iTunesTrack;
      Object.assign(this.currentItem, {
        added_at: currentItem["Date Added"],
        album: currentItem.Album,
        album_artist: currentItem["Album Artist"],
        artist: currentItem.Artist,
        composer: currentItem.Composer,
        disc: currentItem["Disc Number"],
        duration: currentItem["Total Time"],
        external_id: currentItem["Persistent ID"],
        modified_at: currentItem["Date Modified"],
        play_count: currentItem["Play Count"],
        rating: currentItem.Loved
          ? 1
          : currentItem.Rating
          ? (currentItem.Rating / 100)
          : undefined,
        released_at: currentItem["Release Date"] ?? String(currentItem.Year),
        tags: [currentItem.Genre],
        title: currentItem.Name,
        track: currentItem["Track Number"],
      } as Partial<ProvidedSong>);

      for (const oldKey of oldKeys) {
        delete this.currentItem[oldKey];
      }
    }
  }*/
}
