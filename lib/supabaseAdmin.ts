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

/**
 * Pastikan user terautentikasi punya baris di public.users.
 * Tabel bookings, user_identity, dan notifications punya FK ke public.users(id).
 * Jika trigger on_auth_user_created tidak sempat membuat baris (mis. akun dibuat
 * sebelum migrasi trigger, atau registrasi lewat jalur lain), INSERT akan gagal
 * dengan FK violation (23503). Helper ini menyinkronkan data dari auth.users.
 */
export async function ensureUserRecord(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      console.error('[ensureUserRecord] getUserById gagal:', error?.message);
      return;
    }
    const u = data.user;
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: u.id,
          email: u.email || '',
          full_name:
            (u.user_metadata as any)?.full_name ||
            (u.email ? u.email.split('@')[0] : null),
          last_sign_in_at: u.last_sign_in_at || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    if (upsertError) {
      console.error('[ensureUserRecord] upsert users gagal:', upsertError.message);
    }
  } catch (e: any) {
    console.error('[ensureUserRecord] error:', e?.message || e);
  }
}
