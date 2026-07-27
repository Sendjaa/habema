import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export const supabase = createBrowserClient<Database>(supabaseUrl, supabasePublicKey)
