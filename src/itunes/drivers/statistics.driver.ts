import { Driver } from "./driver.ts";

export class StatisticsDriver extends Driver<any> {
  fieldMappings = new Map([
    ["Apple Music", "appleMusic"],
    ["Application Version", "iTunesVersion"],
    ["Bit Rate", "bitrate"],
    ["Clean", "clean"],
    ["Comments", "comments"],
    ["Date", "snappedAt"],
    ["Disliked", "disliked"],
    ["Explicit", "explicit"],
    ["Genre", "genre"],
    ["Kind", "audioKind"],
    ["Library Persistent ID", "externalId"],
    ["Loved", "loved"],
    ["Major Version", "majorVersion"],
    ["Matched", "matched"],
    ["Minor Version", "minorVersion"],
    ["Normalization", "normalization"],
    ["Part Of Gapless Album", "gapless"],
    ["Play Count", "playCount"],
    ["Playlist Persistent ID", "externalId"],
    ["Rating", "rating"],
    ["Sample Rate", "sampleRate"],
    ["Skip Count", "skipCount"],
    ["Track Type", "trackType"],
    ["Volume Adjustment", "volumeAdjustment"],
    ["Work", "work"],
    ["Year", "year"],
    ["Track ID", "all"],
  ]);

  override async processFile(file: Blob): Promise<any> {
    const state = {
      meta: {},
      stats: {
        counter: {
          all: 0,
          appleMusic: 0,
          clean: 0,
          disliked: 0,
          explicit: 0,
          loved: 0,
          matched: 0,
          gapless: 0,
        },
        canonical: {
          comments: {},
          genre: {},
          audioKind: {},
          playCount: {},
          rating: {},
          year: {},
          sampleRate: {},
          skipCount: {},
          trackType: {},
          work: {},
          bitrate: {},
          normalization: {},
          volumeAdjustment: {},
        },
      },
    };

    for await (const event of this.parser.parseFile(file)) {
      let { key, value } = event;

      // skip irrelevant events
      const leafKey = key.at(-1) as string;

      const leafKeyIsIrrelevant = !this.fieldMappings.has(leafKey);

      if (leafKeyIsIrrelevant) {
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
          if (key.at(-1) === "bitrate") {
            value = Math.round(value / 32) * 32;
          }
          if (key.at(-1) === "normalization") {
            value = Math.round(value / 500) * 500;
          }

          if (
            [
              "all",
              "appleMusic",
              "clean",
              "disliked",
              "explicit",
              "loved",
              "matched",
              "gapless",
            ].includes(key.at(-1))
          ) {
            state.stats.counter[key.at(-1)] += 1;
          } else {
            const distribution = state.stats.canonical[key.at(-1)];
            if (distribution[value]) {
              distribution[value] += 1;
            } else {
              distribution[value] = 1;
            }
          }
          break;
        case "Playlists":
          continue;
        default:
          Object.assign(state.meta, { [key[0]]: value });
      }
    }

    const all = state.stats.counter.all;

    for (const field in state.stats.counter) {
      state.stats.counter[field] =
        Math.round(state.stats.counter[field] / all * 100) / 100;
    }
    for (const field in state.stats.canonical) {
      for (const value in state.stats.canonical[field]) {
        state.stats.canonical[field][value] =
          Math.round(state.stats.canonical[field][value] / all * 100) / 100;
      }
    }

    return state;
  }
}
