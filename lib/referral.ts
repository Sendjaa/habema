import { supabaseAdmin } from "@/lib/supabaseAdmin";

const REFERRAL_PREFIX = "HBM";

function randomSuffix(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function buildReferralCode(name?: string) {
  const prefix =
    (name || "")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase() || "HBM";
  return `${REFERRAL_PREFIX}-${prefix}${randomSuffix()}`;
}

export async function generateUniqueReferralCode(name?: string) {
  const db = supabaseAdmin as any;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = buildReferralCode(name);
    const { data } = await db
      .from("users")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (!data) return code;
  }

  return `${REFERRAL_PREFIX}-${randomSuffix(10)}`;
}

export async function ensureReferralCode(userId: string, name?: string) {
  const db = supabaseAdmin as any;
  const { data } = await db
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (data?.referral_code) return data.referral_code as string;

  const code = await generateUniqueReferralCode(name);
  const { error } = await db
    .from("users")
    .update({ referral_code: code })
    .eq("id", userId);

  if (error) {
    console.error("[referral] gagal menyimpan referral_code:", error.message);
    return null;
  }

  return code;
}

export async function findReferrerId(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const db = supabaseAdmin as any;
  const { data } = await db
    .from("users")
    .select("id")
    .eq("referral_code", normalized)
    .maybeSingle();

  return data?.id as string | null;
}

export async function applyReferralReward(userId: string) {
  const db = supabaseAdmin as any;
  const { data, error } = await db.rpc("apply_referral_reward", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[referral] gagal memberi hadiah referral:", error.message);
    return false;
  }

  return Boolean(data);
}
