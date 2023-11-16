import { Database } from "./supabase.ts";

export type ProvidedSong =
  Database["public"]["Tables"]["provided_songs"]["Row"];
