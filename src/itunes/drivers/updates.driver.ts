import { Driver } from "./driver.ts";

type DriverState = {
  songs: Map<number, any>;
  meta: any;
  excludedSongs: Set<number>;
};

export class SongUpdatesDriver extends Driver<any> {
  constructor(public readonly latestUpdate: Date) {
    super();
  }

  fieldMappings = new Map([
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
    ["Release Date", "releaseDate"],
    ["Total Time", "duration"],
    ["Track ID", "externalId"],
    ["Track Number", "track"],
    ["Work", "work"],
    ["Year", "year"],
  ]);

  protected handleTrack(state: DriverState, key: string[], value: any) {
    const [, id, propertyName] = key;
    const trackId = Number(id);
    if (state.songs.has(trackId)) {
      if (
        propertyName === "modifiedAt" && value < this.latestUpdate
      ) {
        //exclude
        state.excludedSongs.add(trackId);
        state.songs.delete(trackId);
      } else {
        // update
        Object.assign(state.songs.get(trackId), { [propertyName]: value });
      }
    } else {
      // create
      state.songs.set(trackId, { [propertyName]: value });
    }
  }

  override async processFile(file: Blob): Promise<any> {
    const state = {
      songs: new Map<number, any>(),
      meta: {},
      excludedSongs: new Set<number>(),
    };

    for await (const event of this.parser.parseFile(file)) {
      const { key, value } = event;

      // skip irrelevant events
      const leafKey = key.at(-1) as string;

      const leafKeyIsIrrelevant = !this.fieldMappings.has(leafKey);
      const trackIsExcluded = key.at(0) === "Tracks" &&
        state.excludedSongs.has(Number(key[1]));

      if (leafKeyIsIrrelevant || trackIsExcluded) {
        continue;
      }

      // transform property names
      if (this.fieldMappings.has(leafKey)) {
        key.pop();
        key.push(this.fieldMappings.get(leafKey) as string);
      }

      // put stuff together
      switch (key[0]) {
        case "Tracks":
          this.handleTrack(state, key, value);
          break;
        case "Playlists":
          continue;
        default:
          Object.assign(state.meta, { [key[0]]: value });
      }
    }

    return {
      meta: state.meta,
      songs: Array.from(state.songs.values()),
    };
  }
}
