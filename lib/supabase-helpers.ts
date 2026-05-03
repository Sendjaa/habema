import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

// Helper function to bypass Supabase TypeScript type inference issues
export async function insertRecord<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  return await supabase
    .from(table)
    .insert(data as any)
    .select()
    .single() as any;
}

export async function insertRecordWithoutReturn<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  return await supabase
    .from(table)
    .insert(data as any);
}
