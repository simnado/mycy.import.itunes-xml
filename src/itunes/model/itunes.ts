export type iTunesTrack = {
  "Track ID": string;
  Name: string;
  Artist: string;
  "Album Artist": string;
  Composer: string;
  Album: string;
  Genre: string;
  "Total Time": number;
  "Disc Number": number;
  "Track Number": number;
  Year: number;
  "Release Date": string;
  "Date Modified": string;
  "Date Added": string;
  "Persistent ID": string;
  "Play Count"?: number;
  Loved?: boolean;
  Rating?: number;
};

export type iTunesLib = {
  Tracks: {
    [key: string]: iTunesTrack;
  }[];
  Playlists: {
    Name: string;
    "Playlist Items": { "Track ID": string }[];
  }[];
  "Major Version": number;
  "Minor Version": number;
  Date: string;
  "Application Version": string;
  "Features": number;
  "Show Content Ratings": boolean;
  "Music Folder": string;
  "Library Persistent ID": string;
};
