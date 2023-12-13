import { iTunesLib } from "./model/itunes.ts";
import { ItunesStream } from "./stream.ts"

type DriverState = {
  songs: Map<number, any>;
  playlists: Map<number, any>;
  meta: any;
  stats: any;
  excludedSongs: Set<number>;
  excludePlaylists: Set<number>;
};

export class ITunesParser {

  protected stream = new ItunesStream();
  protected options = {
    modifiedSince: new Date(0),
    fieldMappings: new Map<string, string>(),
    exclusionFilter: new Map<string, (item) => boolean>()
  }

  constructor(options: {modifiedSince?: Date, fieldMappings?: Map<string, string>, exclusionFilter?: Map<string, (item) => boolean>} = {}) {
    Object.assign(this.options, options)
  }

  protected handleTrack(state: DriverState, key: string[], value: any) {
    const [, id, propertyName] = key;
    const trackId = Number(id);
    if (state.songs.has(trackId)) {
      if (
        propertyName === "modifiedAt" && value < this.options.modifiedSince
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

  protected handlePlaylists(
    state: DriverState,
    key: string[],
    value: any,
  ) {
    const [, idx, propertyName] = key;
    const playlistIdx = Number(idx);
    if (state.playlists.has(playlistIdx)) {
      if (
        this.options.exclusionFilter.has(propertyName) &&
        this.options.exclusionFilter.get(propertyName)(value)
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

    for await (const event of this.stream.parseFile(file)) {
      const { key, value } = event;

      // skip irrelevant events
      const leafKey = key.at(-1) as string;

      const leafKeyIsIrrelevant = !this.options.fieldMappings.has(leafKey) &&
        !this.options.exclusionFilter.has(leafKey);
      const playlistIsExcluded = key.at(0) === "Playlists" &&
        state.excludePlaylists.has(Number(key[1]));
      if (leafKeyIsIrrelevant || playlistIsExcluded) {
        continue;
      }

      // transform property names
      if (this.options.fieldMappings.has(leafKey)) {
        key.pop();
        key.push(this.options.fieldMappings.get(leafKey) as string);
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
