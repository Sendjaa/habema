"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DBOrder, DBShopOrder, DBAddress } from "@/components/account/status-config";

// Profil ini diselaraskan dengan hasil login Google (name/picture/email
// dari user_metadata) lewat /api/account/profile.
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  provider: string;
  email_confirmed: boolean;
  email_confirmed_at?: any;
  last_sign_in_at: string | number | Date | null;
  created_at: string | number | Date | null;
  user_metadata: any;
  app_metadata: any;
}

export function useAccountData() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<DBOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<DBShopOrder[]>([]);
  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  const [reviewedEquipmentIds, setReviewedEquipmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Bookings + shopOrders + reviewedEquipmentIds via service-role API
  // agar tidak terkena RLS/GRANT client (DB live masih 42501 pada
  // role `authenticated` walaupun GRANT sudah dikirim).
  const loadServerData = useCallback(async (uid: string) => {
    try {
      const res = await fetch("/api/account/rentals", { credentials: "include" });
      if (res.status === 401) {
        setBookings([]); setShopOrders([]); setReviewedEquipmentIds([]);
        return;
      }
      if (!res.ok) {
        console.error("[account] Gagal memuat data server:", res.status);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json?.success) {
        setBookings(Array.isArray(json.data?.bookings) ? json.data.bookings : []);
        setShopOrders(Array.isArray(json.data?.shopOrders) ? json.data.shopOrders : []);
        setReviewedEquipmentIds(Array.isArray(json.data?.reviewedEquipmentIds) ? json.data.reviewedEquipmentIds : []);
      }
    } catch (e) {
      console.error("[account] Gagal memuat data server:", e);
    }
  }, []);

  const loadProfile = useCallback(async (authUser: any) => {
    try {
      const res = await fetch("/api/account/profile", { credentials: "include" });
      if (!res.ok) {
        console.warn("[account] Gagal memuat profil server:", res.status);
        return null;
      }
      const json = await res.json().catch(() => ({}));
      if (!json?.success) return null;
      const d = json.data || {};
      return {
        ...authUser,
        id: d.id ?? authUser.id,
        email: d.email ?? authUser.email,
        full_name: d.full_name ?? authUser.user_metadata?.full_name ?? "Petualang Habema",
        phone: d.phone ?? authUser.phone ?? null,
        avatar_url: d.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
        provider: d.provider ?? authUser.app_metadata?.provider ?? "email",
        email_confirmed: d.email_confirmed ?? !!authUser.email_confirmed_at,
        last_sign_in_at: d.last_sign_in_at ?? authUser.last_sign_in_at ?? null,
        created_at: d.created_at ?? authUser.created_at ?? null,
      } as UserProfile;
    } catch (e) {
      console.warn("[account] Gagal memuat profil server:", e);
      return null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setUser(null);
        return;
      }
      const profile = await loadProfile(authUser);
      setUser((profile as UserProfile) || (authUser as unknown as UserProfile));
      const uid = authUser.id;

      await loadServerData(uid);

      // Alamat: tetap via client (read own addresses; RLS sudah mengizinkan)
      try {
        const { data: addrData, error: addrError } = await supabase
          .from("addresses").select("*").eq("user_id", uid);
        setAddresses(addrError ? [] : (addrData ?? []));
      } catch (e) {
        console.warn("[account] addresses:", e);
        setAddresses([]);
      }
    } catch (err) {
      console.error("Error syncing data:", err);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, loadServerData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { user, bookings, shopOrders, addresses, reviewedEquipmentIds, loading, refetch: fetchData };
}

