import { PullParser } from "https://deno.land/x/xmlp/mod.ts";
import { ProvidedSong } from "../../types/models.ts";
import { iTunesLib, iTunesTrack } from "./model/itunes.ts";

type Field = {
  key?: string;
  type?: string;
  value?: any | Field[];
};

type ParseOptions = {
  filterUpdatesSince?: Date;
  transform?: boolean;
};

export class ItunesParser {
  private out: any = {};
  // fields build by key type and value
  currentField: Field = { key: "root" };
  // items build by multiple fields
  currentItem = this.out;
  currentItemParents: any[] = [this.out];

  private reset() {
    this.out = {};
    this.currentField = { key: "root" };
    this.currentItem = this.out;
    this.currentItemParents = [this.out];
  }

  createKey() {
    this.currentField = {};
  }

  createArray() {
    const newArray: any[] = [];
    const arrayKey = this.currentField.key as string;
    const oldChild = this.currentItemParents.at(-1);
    oldChild[arrayKey] = newArray;
    this.currentItemParents.push(newArray);
    this.currentItem = newArray;
  }

  createDict() {
    const newDict = {};
    const dictKey = this.currentField.key as string;
    const oldChild = this.currentItemParents.at(-1);
    if (Array.isArray(oldChild)) {
      oldChild.push(newDict);
    } else {
      oldChild[dictKey] = newDict;
    }
    this.currentItemParents.push(newDict);
    this.currentItem = newDict;
  }

  closeField(type: string) {
    let value = this.currentField.value;
    switch (type) {
      case "string":
      case "data":
        break;
      case "integer":
        value = Number(value);
        break;
      case "date":
        value = new Date(value);
        break;
      case "true":
        value = true;
        break;
      case "false":
        value = false;
        break;
      default:
        throw new Error("unknow type " + type);
    }

    Object.assign(this.currentItem, {
      [this.currentField.key as string]: value,
    });
    this.currentField = {};
  }

  closeArray() {
    this.currentItemParents.pop();
  }

  closeDict() {
    this.currentItemParents.pop();
  }

  private async parseFile(file: Blob, options: ParseOptions) {
    this.reset();
    const parser = new PullParser();

    // create an ES6 generator
    const arrBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrBuffer);
    const events = parser.parse(uint8Array);

    let i = 0;

    for (const node of events) {
      switch (node.name) {
        case "processing_instruction":
        case "doctype":
        case "start_document":
          break;
        case "start_element":
          if (node.element?.qName === "array") {
            this.createArray();
          } else if (node.element?.qName === "dict") {
            this.createDict();
          } else if (node.element?.qName === "key") {
            this.createKey();
          } else if (this.currentField) {
            this.currentField.type = node.element?.qName;
          }
          break;
        case "end_element":
          if (node.element?.qName === "array") {
            this.closeArray();
          } else if (node.element?.qName === "dict") {
            this.closeDict();
            this.postProcessDict(options);
          } else if (!["dict", "key", "plist"].includes(node.element?.qName)) {
            console.log(node.element?.uri);
            this.closeField(node.element?.qName);
          }
          break;
        case "text":
          if (this.currentField.key && this.currentField.type) {
            this.currentField.value = node.text;
          } else {
            this.currentField.key = node.text;
          }
          break;
        case "end_document":
          break;
        default:
          console.warn(`unknown node type "${node.name}"`);
      }

      i++;
    }

    console.log(`processed ${i} lines`);
    return this.out?.root as iTunesLib;
  }

  private postProcessDict(options: ParseOptions) {
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
  }

  private async postProcessRoot(lib: iTunesLib): Promise<ProvidedSong[]> {
    const { Tracks, Playlists } = lib;

    for (const playlist of Playlists) {
      for (const item of playlist["Playlist Items"] ?? []) {
        //const trackId = item["Track ID"];
        //const track = Tracks[trackId]; // maybe deleted
        //track.tags = [...(track.tags ?? []), playlist.Name];
      }
    }

    return Object.values(Tracks);
  }

  async parse(
    file: Blob,
    filterUpdatesSince = new Date(0),
  ): Promise<iTunesLib> {
    if (file.type !== "text/xml") {
      throw new Error("invalid file format");
    }

    let out = await this.parseFile(file, { filterUpdatesSince });

    return out as iTunesLib;
  }

  async parseAndTransform(
    file: Blob,
    options: ParseOptions,
  ): Promise<ProvidedSong[]> {
    if (file.type !== "text/xml") {
      throw new Error("invalid file format");
    }

    let out: any = await this.parseFile(file, options);
    if (options.transform) {
      out = await this.postProcessRoot(out);
    }

    return out;
  }
}
