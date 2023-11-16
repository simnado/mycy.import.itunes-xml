export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      imports: {
        Row: {
          created_at: string;
          id: string;
          provided_by: Database["public"]["Enums"]["library_provider"];
          snapshot_at: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          provided_by: Database["public"]["Enums"]["library_provider"];
          snapshot_at: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          provided_by?: Database["public"]["Enums"]["library_provider"];
          snapshot_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      provided_songs: {
        Row: {
          added_at: string;
          album: string | null;
          album_artist: string | null;
          artist: string;
          composer: string | null;
          created_at: string;
          disc: number | null;
          duration: number;
          external_id: string;
          id: string;
          import_id: string | null;
          modified_at: string;
          play_count: number | null;
          provider: Database["public"]["Enums"]["library_provider"];
          rating: number | null;
          released_at: string | null;
          song_id: string | null;
          tags: string[] | null;
          title: string;
          track: number | null;
          updated_at: string | null;
        };
        Insert: {
          added_at: string;
          album?: string | null;
          album_artist?: string | null;
          artist: string;
          composer?: string | null;
          created_at?: string;
          disc?: number | null;
          duration: number;
          external_id: string;
          id?: string;
          import_id?: string | null;
          modified_at: string;
          play_count?: number | null;
          provider: Database["public"]["Enums"]["library_provider"];
          rating?: number | null;
          released_at?: string | null;
          song_id?: string | null;
          tags?: string[] | null;
          title: string;
          track?: number | null;
          updated_at?: string | null;
        };
        Update: {
          added_at?: string;
          album?: string | null;
          album_artist?: string | null;
          artist?: string;
          composer?: string | null;
          created_at?: string;
          disc?: number | null;
          duration?: number;
          external_id?: string;
          id?: string;
          import_id?: string | null;
          modified_at?: string;
          play_count?: number | null;
          provider?: Database["public"]["Enums"]["library_provider"];
          rating?: number | null;
          released_at?: string | null;
          song_id?: string | null;
          tags?: string[] | null;
          title?: string;
          track?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "provided_songs_import_id_fkey";
            columns: ["import_id"];
            isOneToOne: false;
            referencedRelation: "imports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provided_songs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      songs: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      library_provider: "iTunes";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
