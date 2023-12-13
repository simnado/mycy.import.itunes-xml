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
  // store persistent ids here as well
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
    let fired = false;
    if (state.track?.["Track ID"] === trackId) {
      // update
      Object.assign(state.track, { [propertyName]: value });
    } else {
      // create and fire event
      if (state.track?.["Track ID"]) {
        this.trackListener?.(state.track as iTunesTrack);
        fired = true;
      }
      state.track = {
        ["Track ID"]: trackId,
        [propertyName]: value,
      };
    }
    return fired;
  }

  protected handlePlaylists(
    state: ParserState,
    key: string[],
    value: any,
  ) {
    const [, idx, propertyName] = key;
    const playlistIdx = Number(idx);
    let fired = false;
    if (state.playlist?._idx === playlistIdx) {
      // update
      Object.assign(state.playlist, {
        [propertyName]: value,
      });
    } else {
      // create and fire event
      if (state.playlist?._idx) {
        this.playlistListener?.(state.playlist as iTunesPlaylist);
        fired = true;
      }
      state.playlist = {
        _idx: playlistIdx,
        [propertyName]: value,
      };
    }
    return fired;
  }

  protected handlePlaylistAssignments(
    state: ParserState,
    key: string[],
    value: any,
  ) {
    const playlistIdx = Number(key[1]);
    const trackId = value;

    this.playlistTrackListener?.({
      "Track ID": trackId,
      _idx: playlistIdx,
    });
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
    const stats = {
      songs: 0,
      playlists: 0,
      playlistTracks: 0,
    };
    const state: ParserState = {
      track: {},
      playlist: {},
      meta: {},
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
            this.metaListener?.(state.meta as iTunesLibrary);
            state.meta = null;
          }
          if (this.handleTrack(state, key, value)) {
            stats.songs += 1;
          }
          break;
        case "Playlists":
          if (state.track) {
            // fire last track event
            this.trackListener?.(state.track as iTunesTrack);
            state.track = null;
          }
          if (key.length === 3) {
            // handle playlists
            if (this.handlePlaylists(state, key, value)) {
              stats.playlists += 1;
            }
          } else if (key.length === 5) {
            if (state.playlist) {
              // fire last playlist event
              this.playlistListener?.(state.playlist as iTunesPlaylist);
              state.playlist = null;
              stats.playlists += 1;
            }
            // handle playlist tracks
            this.handlePlaylistAssignments(state, key, value);
            stats.playlistTracks += 1;
          }
          break;
        default:
          Object.assign(state.meta ?? {}, { [key[0]]: value });
      }
    }

    if (state.playlist) {
      // fire last playlist event
      this.playlistListener?.(state.playlist as iTunesPlaylist);
      state.playlist = null;
    }

    return stats;
  }
}
