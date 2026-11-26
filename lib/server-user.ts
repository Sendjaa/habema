import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function getServerUser(request: NextRequest) {
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data } = await supabaseServer.auth.getUser();
  return data.user ?? null;
}
