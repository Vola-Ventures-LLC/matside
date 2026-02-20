import { createContext, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export const SupabaseProvider = SupabaseContext.Provider;

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error(
      "useSupabase must be used within a SupabaseProvider. " +
      "Wrap your app with <SupabaseProvider value={supabaseClient}>."
    );
  }
  return client;
}
