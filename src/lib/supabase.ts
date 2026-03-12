import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ログイン済みユーザー用：ClerkのJWTをSupabaseに渡すクライアント
export function useSupabaseClient() {
  const { getToken } = useAuth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: "supabase" });
          const headers = new Headers(options?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(url, { ...options, headers });
        },
      },
    }
  );
}