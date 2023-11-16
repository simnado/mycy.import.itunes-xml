import { Driver } from "./driver.ts";
import { iTunesLib } from "../model/itunes.ts";

type DriverState = {
  songs: Map<number, any>;
  playlists: Map<number, any>;
  meta: any;
  stats: any;
};

export class DumpDriver extends Driver<iTunesLib> {
  protected handleTrack(state: DriverState, key: string[], value: any) {
    const [, id, propertyName] = key;
    const trackId = Number(id);
    if (state.songs.has(trackId)) {
      Object.assign(state.songs.get(trackId), { [propertyName]: value });
    } else {
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
      Object.assign(state.playlists.get(playlistIdx), {
        [propertyName]: value,
      });
    } else {
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
      song.playlists = [...(song.playlists ?? []), playlist.Name];
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
    };

    for await (const event of this.parser.parseFile(file)) {
      const { key, value } = event;
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
