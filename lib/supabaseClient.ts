import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Deteksi dini bila env belum termuat (mis. dev server belum di-restart setelah
// mengisi .env). Tanpa ini, request auth akan gagal dengan "Failed to fetch"
// yang menyesatkan alih-alih menunjukkan akar masalah konfigurasi.
if (!supabaseUrl || !supabasePublicKey) {
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabasePublicKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `[Supabase] Environment variable belum termuat: ${missing}. ` +
      `Pastikan nilainya ada di .env / .env.local, lalu restart dev server (npm run dev).`
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublicKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export { createClient };
