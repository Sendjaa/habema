"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DBOrder, DBShopOrder, DBAddress } from "@/components/account/status-config";

export interface UserProfile {
  last_sign_in_at: string | number | Date;
  email_confirmed_at: any;
  id: string;
  auth_user_id: string;
  created_at: string;
  email: string | null;
  phone: string | null;
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

  const fetchData = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setUser(null);
        return;
      }
      setUser(authUser as unknown as UserProfile);
      const uid = authUser.id;

      // Bookings (rental)
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings").select("*").eq("user_id", uid).order("created_at", { ascending: false });
        if (!bookingsError && bookingsData) {
          const bookingsWithItems = await Promise.all(
            bookingsData.map(async (booking: any) => {
              try {
                const { data: itemsData } = await supabase
                  .from("booking_items").select(`*, equipment (name, image_url)`).eq("booking_id", booking.id);
                return { ...booking, booking_items: itemsData || [] };
              } catch { return { ...booking, booking_items: [] }; }
            })
          );
          setBookings(bookingsWithItems.map((booking: any) => ({
            id: booking.id,
            items: booking.booking_items?.map((item: any) => item.equipment?.name || "Equipment") || [],
            total: booking.total_cost || 0,
            status: booking.status,
            payment_status: booking.payment_status || null,
            pickup_date: booking.pickup_date,
            created_at: booking.created_at,
            start_date: booking.start_date,
            end_date: booking.end_date,
            rental_days: booking.rental_days,
            cancel_reason: booking.cancel_reason || null,
            cancel_note: booking.cancel_note || null,
          })));
        }
      } catch { /* silent */ }

      // Shop orders (checkout toko) + items dengan info produk untuk image
      try {
        const { data: shopData, error: shopError } = await (supabase as any)
          .from("shop_orders").select("*").eq("user_id", uid).order("created_at", { ascending: false });
        if (!shopError && shopData) {
          const orderIds = shopData.map((o: any) => o.id);
          const { data: itemsData } = await (supabase as any)
            .from("shop_order_items").select("*").in("order_id", orderIds);
          const items = itemsData || [];
          const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
          let productMap: Record<string, any> = {};
          if (productIds.length > 0) {
            const { data: products } = await (supabase as any)
              .from("shop_products").select("id, name, image_url").in("id", productIds);
            if (products) {
              for (const p of products) productMap[p.id] = p;
            }
          }
          const itemsByOrder: Record<string, any[]> = {};
          for (const item of items) {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push({ ...item, product: productMap[item.product_id] || null });
          }
          setShopOrders(shopData.map((order: any) => ({
            id: order.id,
            order_id: order.order_id,
            status: order.status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            subtotal: order.subtotal || 0,
            discount_amount: order.discount_amount || 0,
            delivery_cost: order.delivery_cost || 0,
            total_amount: order.total_amount || 0,
            created_at: order.created_at,
            cancel_reason: order.cancel_reason || null,
            cancel_note: order.cancel_note || null,
            items: itemsByOrder[order.id] || [],
          })));
        }
      } catch { /* silent */ }

      // Addresses
      try {
        const { data: addrData, error: addrError } = await supabase
          .from("addresses").select("*").eq("user_id", uid);
        setAddresses(addrError ? [] : (addrData ?? []));
      } catch { setAddresses([]); }

      // Reviews user (untuk "beri penilaian")
      try {
        const { data: reviewData, error: reviewError } = await supabase
          .from("reviews").select("equipment_id").eq("user_id", uid);
        if (!reviewError && reviewData) {
          setReviewedEquipmentIds([...new Set(reviewData.map((r) => r.equipment_id))]);
        }
      } catch { /* silent */ }
    } catch (err) {
      console.error("Error syncing data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { user, bookings, shopOrders, addresses, reviewedEquipmentIds, loading, refetch: fetchData };
}
