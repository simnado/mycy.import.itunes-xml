import {
  iTunesLibrary,
  iTunesPlaylist,
  iTunesPlaylistTrack,
  iTunesTrack,
} from "./model/itunes.ts";
import { ItunesStream } from "./stream.ts";

type ParserState = {
  meta: Partial<iTunesLibrary> | null;
  track: Partial<iTunesTrack> | null;
  playlist: Partial<iTunesPlaylist> | null;
  trackIds: Map<number, string>;
  playlistIds: Map<number, string>;
  playlistTracks: number;
};

type ITunesEventListener = {
  (event: "meta", listener: (data: iTunesLibrary) => void): ITunesParser;
  (event: "track", listener: (data: iTunesTrack) => void): ITunesParser;
  (event: "playlist", listener: (data: iTunesPlaylist) => void): ITunesParser;
  (
    event: "playlistTrack",
    listener: (data: iTunesPlaylistTrack) => void,
  ): ITunesParser;
};

export class ITunesParser {
  protected stream = new ItunesStream();

  private metaListener?: (data: iTunesLibrary) => void;
  private trackListener?: (data: iTunesTrack) => void;
  private playlistListener?: (data: iTunesPlaylist) => void;
  private playlistTrackListener?: (data: iTunesPlaylistTrack) => void;

  protected handleTrack(state: ParserState, key: string[], value: any) {
    const [, id, propertyName] = key;
    const trackId = Number(id);
    if (state.track?.["Track ID"] === trackId) {
      // update
      Object.assign(state.track, { [propertyName]: value });
    } else {
      // create and fire event
      if (state.track?.["Track ID"]) {
        this.fireTrack(state);
      }
      state.track = {
        ["Track ID"]: trackId,
        [propertyName]: value,
      };
    }
  }

  protected handlePlaylists(
    state: ParserState,
    key: string[],
    value: any,
  ) {
    const [, idx, propertyName] = key;
    const playlistIdx = Number(idx);
    if (state.playlist?._idx === playlistIdx) {
      // update
      Object.assign(state.playlist, {
        [propertyName]: value,
      });
    } else {
      // create and fire event
      if (state.playlist?._idx) {
        this.firePlaylist(state);
      }
      state.playlist = {
        _idx: playlistIdx,
        [propertyName]: value,
      };
    }
  }

  protected handlePlaylistAssignments(
    state: ParserState,
    key: string[],
    value: any,
  ) {
    const playlistIdx = Number(key[1]);
    const trackId = value;

    const persistentTrackId = state.trackIds.get(trackId);
    const persistentPlaylistId = state.playlistIds.get(playlistIdx);

    if (persistentTrackId && persistentPlaylistId) {
      this.playlistTrackListener?.({
        "Persistent ID": persistentTrackId,
        "Playlist Persistent ID": persistentPlaylistId,
        //"Track ID": trackId,
        //_idx: playlistIdx,
      });
      state.playlistTracks += 1;
    } else if (playlistIdx === 0) {
      // skip "Mediathek" playlist
      return;
    } else {
      console.warn(
        `no persistant ids for playlistTrack Track(${trackId}=>${persistentTrackId}) x Playlist(${playlistIdx}=>${persistentPlaylistId})`,
      );
    }
  }

  private fireMeta(state: ParserState) {
    this.metaListener?.(state.meta as iTunesLibrary);
    state.meta = null;
  }

  private fireTrack(state: ParserState) {
    if (state.track?.["Track ID"]) {
      this.trackListener?.(state.track as iTunesTrack);
      state.trackIds.set(
        state.track["Track ID"],
        state.track["Persistent ID"] as string,
      );
      state.track = null;
    }
  }

  private firePlaylist(state: ParserState) {
    if (state.playlist?._idx) {
      this.playlistListener?.(state.playlist as iTunesPlaylist);
      state.playlistIds.set(
        state.playlist._idx,
        state.playlist["Playlist Persistent ID"] as string,
      );
      state.playlist = null;
    }
  }

  on: ITunesEventListener = (event, callback) => {
    switch (event) {
      case "meta":
        this.metaListener = callback as (data: iTunesLibrary) => void;
        break;
      case "track":
        this.trackListener = callback as (data: iTunesTrack) => void;
        break;
      case "playlist":
        this.playlistListener = callback as (data: iTunesPlaylist) => void;
        break;
      case "playlistTrack":
        this.playlistTrackListener = callback as (
          data: iTunesPlaylistTrack,
        ) => void;
        break;
      default:
        throw new Error(`unknown event called ${event}`);
    }
    return this;
  };

  async processFile(file: Blob) {
    const state: ParserState = {
      track: {},
      playlist: {},
      meta: {},
      trackIds: new Map(),
      playlistIds: new Map(),
      playlistTracks: 0,
    };

    for await (const event of this.stream.parseFile(file)) {
      const { key, value } = event;

      // skip irrelevant events
      const leafKey = key.at(-1) as string;

      // safe property name
      key.pop();
      key.push(leafKey);

      // put stuff together
      switch (key[0]) {
        case "Tracks":
          if (state.meta) {
            // fire meta event
            this.fireMeta(state);
          }
          this.handleTrack(state, key, value);
          break;
        case "Playlists":
          if (state.track) {
            // fire last track event
            this.fireTrack(state);
          }
          if (key.length === 3) {
            // handle playlists
            this.handlePlaylists(state, key, value);
          } else if (key.length === 5) {
            if (state.playlist) {
              // fire last playlist event
              this.firePlaylist(state);
            }
            // handle playlist tracks
            this.handlePlaylistAssignments(state, key, value);
          }
          break;
        default:
          Object.assign(state.meta ?? {}, { [key[0]]: value });
      }
    }

    if (state.playlist) {
      // fire last playlist event
      this.firePlaylist(state);
    }

    return {
      tracks: state.trackIds.size,
      playlists: state.playlistIds.size,
      playlistTracks: state.playlistTracks,
    };
  }
}
