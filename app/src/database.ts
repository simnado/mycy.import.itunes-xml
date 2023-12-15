import mongoose from "mongoose";
import { Schema } from "mongoose";
import { Track } from "./models/models.ts";

export class Database {
  static async connect(url: string) {
    await mongoose.connect(url);
    return new this();
  }

  protected syncModel = mongoose.model(
    "Sync",
    new Schema({
      snappedAt: { type: Date },
      libraryId: String,
      xmlVersion: String,
      applicationVersion: String,
    }),
  );

  protected playlistModel = mongoose.model(
    "Playlist",
    new Schema({
      name: String,
      persistentId: String,
      isSmart: Boolean,
    }),
  );

  protected trackModel = mongoose.model(
    "Track",
    new Schema({
      addedAt: Date,
      albumTitle: String,
      albumArtists: String,
      artists: String,
      bitrate: Number,
      cloudStatus: {
        type: String,
        enum: ["Apple Music", "Matched", "Uploaded"],
      },
      contentRating: {
        type: String,
        enum: ["Clean", "Explicit"],
      },
      comments: String,
      composers: String,
      disc: Number,
      duration: Number,
      fileFormat: String,
      fileSize: Number,
      gapless: Boolean,
      genre: String,
      likeFactor: {
        type: Number,
        enum: [-1, 1],
      },
      modifiedAt: Date,
      normalization: Number,
      persistentId: { type: String, unique: true, index: true },
      playCount: Number,
      rating: {
        type: Number,
        min: 0,
        max: 1,
      },
      releaseDate: Date,
      releaseYear: Number,
      sampleRate: Number,
      skipCount: Number,
      title: String,
      track: Number,
      volumeAdjustment: Number,
      work: String,
    }),
  );

  private constructor() {}

  public async upsertTrack(data: Track) {
    await this.trackModel.updateOne({ persistentId: data.persistentId }, data, {
      upsert: true,
    });
  }
}
