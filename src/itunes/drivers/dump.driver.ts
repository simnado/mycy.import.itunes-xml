import { Driver } from "./driver.ts";
import { SongUpdatesDriver } from "./updates.driver.ts";
import { iTunesLib } from "../model/itunes.ts";

type DriverState = {
  songs: Map<number, any>;
  playlists: Map<number, any>;
  meta: any;
  stats: any;
  excludePlaylists: Set<number>;
};

export class DumpDriver extends SongUpdatesDriver {
    constructor() {
        super(new Date(0))
    }

  exclusionFilter = new Map([
    ["Distinguished Kind", () => true],
    ["Folder", () => true],
    ["Master", () => true],
    ["Smart Criteria", () => true],
  ]);

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
    ["Playlist Persistent ID", "externalId"],
    ["Release Date", "releaseDate"],
    ["Total Time", "duration"],
    ["Track ID", "externalId"],
    ["Track Number", "track"],
    ["Work", "work"],
    ["Year", "year"],
  ]);

  protected handlePlaylists(
    state: DriverState,
    key: string[],
    value: any,
  ) {
    const [, idx, propertyName] = key;
    const playlistIdx = Number(idx);
    if (state.playlists.has(playlistIdx)) {
      if (
        this.exclusionFilter.has(propertyName) &&
        this.exclusionFilter.get(propertyName)(value)
      ) {
        //exclude
        state.excludePlaylists.add(playlistIdx);
        state.playlists.delete(playlistIdx);
      } else {
        // update
        Object.assign(state.playlists.get(playlistIdx), {
          [propertyName]: value,
        });
      }
    } else {
      // create
      state.playlists.set(playlistIdx, { [propertyName]: value });
    }
  }

  protected handlePlaylistAssignments(
    state: DriverState,
    key: string[],
    value: any,
  ) {
    const playlistIdx = Number(key[1]);
    if (state.playlists.has(playlistIdx) && state.songs.has(value)) {
      const playlist = state.playlists.get(playlistIdx);
      const song = state.songs.get(value);
      song.playlists = [...(song.playlists ?? []), playlist.title];
      playlist.songs = (playlist.songs ?? 0) + 1;
    } else {
      console.log(
        playlistIdx,
        value,
        state.playlists.has(playlistIdx),
        state.songs.has(value),
      );
    }
  }

  override async processFile(file: Blob): Promise<iTunesLib> {
    const state = {
      songs: new Map<number, any>(),
      playlists: new Map<number, any>(),
      meta: {},
      stats: {},
      excludePlaylists: new Set<number>(),
    };

    for await (const event of this.parser.parseFile(file)) {
      const { key, value } = event;

      // skip irrelevant events
      const leafKey = key.at(-1) as string;

      const leafKeyIsIrrelevant = !this.fieldMappings.has(leafKey) &&
        !this.exclusionFilter.has(leafKey);
      const playlistIsExcluded = key.at(0) === "Playlists" &&
        state.excludePlaylists.has(Number(key[1]));
      if (leafKeyIsIrrelevant || playlistIsExcluded) {
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
          if (key.length === 3) {
            this.handlePlaylists(state, key, value);
          } else if (key.length === 5) {
            this.handlePlaylistAssignments(state, key, value);
          }
          break;
        default:
          Object.assign(state.meta, { [key[0]]: value });
      }
    }

    return {
      meta: state.meta,
      songs: Array.from(state.songs.values()),
      playlists: Array.from(state.playlists.values()),
    };
  }
}
