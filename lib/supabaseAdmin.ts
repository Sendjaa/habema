import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Singleton pattern for admin Supabase client with different storage key
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          // Use different storage key to avoid conflicts
          storageKey: 'supabase.auth.admin-token'
        }
      }
    );
  }
  return supabaseAdminInstance;
}

// Export as singleton instance
export const supabaseAdmin = getSupabaseAdmin();
