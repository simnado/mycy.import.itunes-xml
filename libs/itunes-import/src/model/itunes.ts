export type iTunesLibrary = {
  "Major Version": number;
  "Minor Version": number;
  Date: string;
  "Application Version": string;
  "Features": number;
  "Show Content Ratings": boolean;
  "Music Folder": string;
  "Library Persistent ID": string;
};

export type iTunesTrack = {
  Album: string;
  "Album Artist": string;
  "Apple Music"?: boolean;
  Artist: string;
  "Bit Rate": number;
  Clean?: boolean;
  Comments?: string;
  Composer: string;
  "Date Added": string;
  "Date Modified": string;
  "Disc Number": number;
  Disliked?: boolean;
  Explicit?: boolean;
  Genre: string;
  Kind: string;
  Loved?: boolean;
  Matched?: boolean;
  Name: string;
  Normalization: number;
  "Part Of Gapless Album"?: boolean;
  "Persistent ID": string;
  "Play Count"?: number;
  Rating?: number;
  "Release Date": string;
  "Sample Rate"?: number;
  "Skip Count"?: number;
  "Total Time": number;
  "Track ID": number;
  "Track Number": number;
  "Track Type"?: string;
  "Volume Adjustment"?: number;
  Work?: string;
  Year: number;
};

export type iTunesPlaylist = {
  _idx: number;
  Name: string;
  "Playlist ID": number;
  "Playlist Persistent ID": string;
  "All Items": boolean;
  "Smart Info": string;
  "Smart Criteria": string;
  "Music": boolean;
  "Distinguished Kind": number;
  Visible: boolean;
  Master: boolean;
  Folder: boolean;
  // Todo: Parent Folder logic
};

export type iTunesPlaylistTrack = {
  _idx: number; // playlist idx -> not cool
  "Track ID": number;
};
