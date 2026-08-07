"use client";

// ==================== IMPORTS ====================
import { useState, Suspense, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { calculateDaysBetween } from "@/lib/booking-utils";
import { CheckCircle, Loader2, MapPin, Ticket } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { LoginModal } from "@/components/auth/login-modal";
import type { Database } from "@/types/supabase";
import { LazyWrapper, LazyIDVerificationForm } from "@/components/lazy-components";
import { OptimizedImage } from "@/components/optimized-image";
import {
  RentalConditionsChecklist,
  ConditionChecklistData,
} from "@/components/checkout/rental-conditions-checklist";
import {
  useCartStore,
  type ClaimedDiscount,
  type TransactionData,
} from "@/lib/store";
import { toast } from "sonner";

// ==================== MIDTRANS SNAP ====================
const loadMidtransScript = () => {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const script = document.createElement("script");
    script.src =
      process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === "true"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(window.snap);
    document.body.appendChild(script);
  });
};

declare global {
  interface Window {
    snap: any;
  }
}

// ==================== MAIN COMPONENT ====================
function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const quantity = parseInt(searchParams.get("quantity") || "1");

  // Tanggal dibawa dari katalog/hero (format YYYY-MM-DD). Dipakai sebagai nilai
  // awal agar pengguna tidak perlu memilih ulang di halaman booking.
  const urlStartDate = searchParams.get("startDate");
  const urlEndDate = searchParams.get("endDate");
  const parseUrlDate = (v: string | null): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  // ==================== STATE ====================
  const [user, setUser] = useState<User | null>(null);
  const transaction = useCartStore((state) => state.currentTransaction);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(() =>
    parseUrlDate(urlStartDate),
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    parseUrlDate(urlEndDate),
  );

  const [idData, setIdData] = useState<any | null>(null);
  const [conditionData, setConditionData] =
    useState<ConditionChecklistData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const skipAuthCheck = useRef(false);
  const idFormRef = useRef<any>(null);
  const idDataRef = useRef<any>(null);

  const [customerNote, setCustomerNote] = useState("");

  // Kupon yang sudah diklaim user
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // ==================== EFFECTS ====================
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (paymentMethod !== "Transfer Bank") {
      setSelectedBank(null);
    }
  }, [paymentMethod]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment")
        .select(`*, equipment_categories(name)`)
        .eq("id", productId)
        .single();
      if (!error) setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  // Selaraskan transaksi dengan produk yang diklik dari halaman produk/katalog.
  // currentTransaction terpersistensi di localStorage, sehingga tanpa ini ringkasan
  // akan menampilkan item lama dari sesi sebelumnya (dan bisa duplikat).
  useEffect(() => {
    if (!productId || !product || loading) return;

    const urlItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price_per_night),
      quantity: Math.max(1, Number(quantity)),
      category: product.equipment_categories?.name || "Equipment",
      image_url: product.image_url,
    };

    const current = useCartStore.getState().currentTransaction;
    const items = Array.isArray(current?.items) ? current.items : [];

    // Dedup by id: gabungkan qty agar item duplikat tidak pernah tampil dua kali.
    const deduped = items.reduce((acc: any[], item: any) => {
      const found = acc.find((x: any) => String(x.id) === String(item.id));
      if (found) {
        found.quantity = Number(found.quantity || 1) + Number(item.quantity || 1);
        if (!found.image_url && item.image_url) found.image_url = item.image_url;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, []);

    const hasProduct = deduped.some((item: any) => String(item.id) === String(productId));

    // Dari halaman produk: reset ke produk yang diklik agar sesi lama tidak bocor.
    // Dari keranjang (item sudah memuat produk URL): pertahankan semua item.
    const nextItems = hasProduct ? deduped : [urlItem];
    const next: TransactionData = hasProduct
      ? { ...current!, items: nextItems }
      : {
          items: nextItems,
          duration: current?.duration || 0,
          days: current?.days || 0,
          totalPrice:
            current?.totalPrice || Number(urlItem.price) * urlItem.quantity,
          delivery: current?.delivery,
          orderId: undefined,
          payment: { method: "", bank: "" },
          dates: undefined,
        };

    const same =
      JSON.stringify(items.map((i: any) => [String(i.id), i.quantity])) ===
      JSON.stringify(nextItems.map((i: any) => [String(i.id), i.quantity]));
    if (!same) {
      useCartStore.getState().setTransaction(next);
    }
  }, [product, productId, quantity, loading]);

  // Lengkapi gambar item transaksi yang tidak punya image_url (mis. transaksi
  // lama dari localStorage) dengan mengambilnya langsung dari tabel equipment.
  useEffect(() => {
    const enrichItemImages = async () => {
      const items = transaction?.items;
      if (!Array.isArray(items) || items.length === 0) return;

      const missingIds = items
        .filter((it: any) => it?.id && !it.image_url)
        .map((it: any) => String(it.id));
      if (missingIds.length === 0) return;

      const { data, error } = await supabase
        .from("equipment")
        .select("id, image_url")
        .in("id", missingIds);
      if (error || !data) return;

      const imageById = new Map(
        data.map((row: any) => [String(row.id), row.image_url]),
      );
      const enriched = items.map((it: any) =>
        !it.image_url && imageById.get(String(it.id))
          ? { ...it, image_url: imageById.get(String(it.id)) }
          : it,
      );

      // Hanya update bila ada perubahan agar tidak memicu loop
      const changed = enriched.some(
        (it: any, i: number) => it.image_url !== items[i].image_url,
      );
      if (changed) {
        useCartStore.getState().setTransaction({ ...transaction!, items: enriched });
      }
    };
    enrichItemImages();
  }, [transaction]);

  // Muat syarat & kondisi yang sudah diisi sebelumnya dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rentalConditions");
      if (saved) setConditionData(JSON.parse(saved));
    } catch {
      // abaikan data korup
    }
  }, []);

  // Muat identitas yang tersimpan jika user login
  useEffect(() => {
    const loadExistingIdentityData = async () => {
      if (!user) return;

      try {
        const { data: identityData, error } = await supabase
          .from("user_identity")
          .select("*")
          .eq("user_id", user.id)
          .single()
          .returns<Database["public"]["Tables"]["user_identity"]["Row"]>();

        if (!error && identityData) {
          setIdData({
            fullName: user.user_metadata?.full_name || "",
            idNumber: identityData.id_number || "",
            idType: identityData.id_type || "",
            phone: user.phone || "",
          });
        }
      } catch {
        // tidak ada data identitas sebelumnya
      }
    };

    loadExistingIdentityData();
  }, [user]);

  // Ambil daftar kupon yang sudah diklaim oleh user yang login
  useEffect(() => {
    const fetchMyCoupons = async () => {
      if (!user) {
        setMyCoupons([]);
        return;
      }
      setLoadingCoupons(true);
      try {
        const res = await fetch(`/api/user-discounts?userId=${encodeURIComponent(user.id)}`);
        const result = await res.json();
        if (res.ok && result.success) {
          setMyCoupons(result.data || []);
        }
      } catch {
        // abaikan error saat memuat kupon
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchMyCoupons();
  }, [user]);

  // ==================== CALCULATIONS ====================
  const days =
    startDate && endDate ? Math.max(1, calculateDaysBetween(startDate, endDate)) : 0;
  const pricePerNight = product ? Number(product.price_per_night) : 0;

  // Subtotal dihitung dari item keranjang, fallback ke produk tunggal dari URL
  const subtotal =
    transaction?.items && transaction.items.length > 0
      ? transaction.items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0,
        ) * days
      : pricePerNight * quantity * days;

  const claimedDiscount = useCartStore((s) => s.claimedDiscount);
  // Diskon hanya berlaku untuk user yang sudah login.
  const discountEligible = !!user;
  let discountAmount = 0;
  if (claimedDiscount && discountEligible) {
    const meetsMinPurchase =
      !claimedDiscount.min_purchase || subtotal >= claimedDiscount.min_purchase;
    if (meetsMinPurchase) {
      if (claimedDiscount.discount_type === "percentage") {
        discountAmount = Math.round((subtotal * claimedDiscount.discount_value) / 100);
        if (
          claimedDiscount.max_discount &&
          discountAmount > claimedDiscount.max_discount
        ) {
          discountAmount = claimedDiscount.max_discount;
        }
      } else {
        discountAmount = claimedDiscount.discount_value;
      }
    }
  }
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const deposit = Math.round(discountedSubtotal * 0.2);
  const totalPrice = discountedSubtotal;
  const setTransactionData = useCartStore((state) => state.setTransaction);

  // Cek apakah sebuah kupon bisa dipakai untuk booking ini
  const getCouponEligibility = (d: any) => {
    if (!d) return { eligible: false, reason: "Kupon tidak valid" };
    if (d.min_purchase && subtotal < Number(d.min_purchase)) {
      return {
        eligible: false,
        reason: `Min. belanja Rp${Number(d.min_purchase).toLocaleString("id-ID")}`,
      };
    }
    return { eligible: true, reason: "" };
  };

  const applyCoupon = (discount: any) => {
    if (!discount) return;
    const claimed: ClaimedDiscount = {
      id: discount.id,
      code: discount.code,
      description: discount.description,
      discount_type: discount.discount_type as "percentage" | "fixed",
      discount_value: Number(discount.discount_value),
      min_purchase: discount.min_purchase ? Number(discount.min_purchase) : null,
      max_discount: discount.max_discount ? Number(discount.max_discount) : null,
      applies_to: discount.applies_to as "all" | "category" | "equipment",
      target_id: discount.target_id,
      claimed_at: new Date().toISOString(),
    };
    useCartStore.getState().setClaimedDiscount(claimed);
    toast.success(`Kupon ${discount.code} berhasil diterapkan!`);
  };

  const clearCoupon = () => {
    useCartStore.getState().clearClaimedDiscount();
    toast.info("Kupon dibatalkan");
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // ==================== BOOKING HANDLERS ====================
  // Tombol utama tunggal di akhir halaman: selesaikan verifikasi identitas
  // (bila belum), lalu proses booking & pembayaran.
  const handleCheckout = async () => {
    try {
      if (!idDataRef.current) {
        const result = await idFormRef.current?.submit();
        if (!result) return;
      }
      await handleFinalAction();
    } catch (error: any) {
      toast.error(`Gagal memproses pesanan: ${error?.message || "Terjadi kesalahan sistem"}`);
    }
  };

  const handleFinalAction = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const identity = idDataRef.current || idData;

      if (!productId) throw new Error("ID Produk tidak ditemukan.");
      if (!product) throw new Error("Produk tidak ditemukan.");
      if (!startDate || !endDate)
        throw new Error("Silakan pilih tanggal sewa terlebih dahulu.");
      if (!conditionData)
        throw new Error("Silakan lengkapi syarat dan kondisi terlebih dahulu.");

      // Item yang akan dipesan. Prioritaskan item dari keranjang (transaction),
      // fallback ke produk tunggal dari URL bila halaman dibuka langsung dari katalog.
      const sourceItems =
        transaction?.items && transaction.items.length > 0
          ? transaction.items
          : [
              {
                id: product.id,
                name: product.name,
                price: Number(product.price_per_night),
                quantity: Number(quantity),
                category: product.equipment_categories?.name || "Equipment",
                image_url: product.image_url,
              },
            ];

      const orderData = {
        user_id: user?.id || null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "pending",
        delivery_option: "pickup",
        delivery_address: null,
        customer_note: customerNote || null,
        total_cost: totalPrice,
        rental_days: days,
        subtotal: subtotal,
        deposit_amount: deposit,
      };

      // Guest: minta login dulu sebelum melanjutkan
      if (!user && !skipAuthCheck.current) {
        setShowLoginModal(true);
        return;
      }

      // Simpan booking via server API — kirim semua item dari keranjang
      const itemData = sourceItems.map((item: any) => ({
        equipment_id: item.id,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        subtotal: Number(item.price) * Number(item.quantity) * Number(days),
      }));

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderData,
          itemData,
          userEmail: user?.email || null,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          [result.error, result.detail].filter(Boolean).join(": ") ||
            "Failed to create booking",
        );
      }

      const newBooking = result.data;

      // Update Global State (Zustand) — pertahankan items dari keranjang
      setTransactionData({
        ...transaction,
        items: sourceItems,
        orderId: newBooking.id,
        days: Number(days),
        duration: Number(days),
        totalPrice: Number(totalPrice),
        payment: { method: paymentMethod, bank: selectedBank || undefined },
        delivery: {
          option: "pickup",
          address: null,
          note: customerNote || null,
        },
        dates: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      // ===== Alur WhatsApp =====
      if (paymentMethod === "WhatsApp Konfirmasi") {
        const waMessage = `Halo Admin Habema!
Saya ingin menyewa: *${product.name}*
ID Booking: #${newBooking.id.slice(0, 8)}
User: ${user ? user.email : "Guest"}
Durasi: ${days} Hari
Total: Rp${Number(totalPrice).toLocaleString("id-ID")}

Metode Pengambilan: Ambil di Tempat${customerNote ? `
Pesan: ${customerNote}` : ""}

Data Identitas:
Nama: ${identity?.fullName || "Guest"}
ID: ${identity?.idNumber || "-"}
Tipe: ${identity?.idType || "-"}

Mohon konfirmasi pesanan saya ya!`;

        if (!user) {
          localStorage.setItem(
            "recentBooking",
            JSON.stringify({
              id: newBooking.id,
              product: product.name,
              days: Number(days),
              totalPrice: Number(totalPrice),
              pricePerNight: Number(pricePerNight),
              quantity: Number(quantity),
              timestamp: new Date().toISOString(),
            }),
          );
        }

        window.open(
          `https://wa.me/${user ? "6289509162484" : "6283898749357"}?text=${encodeURIComponent(waMessage)}`,
          "_blank",
        );

        router.push("/order-confirmation");
        return;
      }

      // ===== Alur Midtrans (QRIS / Transfer Bank) =====
      await handleMidtransPayment(newBooking.id, identity);
    } catch (error: any) {
      console.error("Error saat menyimpan pesanan:", error);
      toast.error(
        `Gagal menyimpan pesanan: ${error?.message || "Terjadi kesalahan sistem"}`,
      );
    }
  };

  const handleMidtransPayment = async (bookingId: string, identity: any) => {
    setIsProcessingPayment(true);

    try {
      if (!product || !product.id || !product.name || !product.price_per_night) {
        throw new Error("Data produk tidak lengkap");
      }
      if (!startDate || !endDate) {
        throw new Error("Silakan pilih tanggal sewa terlebih dahulu");
      }
      if (!conditionData) {
        throw new Error("Silakan lengkapi syarat dan kondisi terlebih dahulu");
      }
      if (!identity) {
        throw new Error("Silakan lengkapi verifikasi identitas terlebih dahulu");
      }
      if (!paymentMethod) {
        throw new Error("Silakan pilih metode pembayaran terlebih dahulu");
      }
      if (paymentMethod === "Transfer Bank" && !selectedBank) {
        throw new Error("Silakan pilih bank terlebih dahulu");
      }
      if (!days || days <= 0) {
        throw new Error("Durasi sewa tidak valid");
      }
      if (!totalPrice || totalPrice <= 0) {
        throw new Error("Total harga tidak valid");
      }
      if (!quantity || quantity <= 0) {
        throw new Error("Jumlah produk tidak valid");
      }

      const transactionData = {
        items: [
          {
            id: product.id,
            name: product.name,
            price: Number(product.price_per_night),
            quantity: quantity,
            category: product.equipment_categories?.name || "Equipment",
            image_url: product.image_url,
          },
        ],
        duration: Number(days),
        days: Number(days),
        payment: {
          method: paymentMethod,
          bank: selectedBank || undefined,
          bookingId: bookingId,
        },
        paymentMethod: "Midtrans",
        totalPrice: Number(totalPrice),
      };

      // Gabung dengan data yang sudah ada agar items, dates, dll tidak hilang
      const existingTransaction = useCartStore.getState().currentTransaction;
      useCartStore.getState().setTransaction({
        ...existingTransaction,
        items: existingTransaction?.items ?? [],
        duration: Number(days),
        days: Number(days),
        totalPrice: Number(totalPrice),
        payment: transactionData.payment,
      });

      // Harga dihitung ulang di server dari bookingId
      const midtransPayload = {
        bookingId: bookingId,
        customerDetails: {
          firstName: identity?.fullName || "Customer",
          email: user?.email || "customer@example.com",
          phone: identity?.phone || "+62800000000",
        },
      };

      const response = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(midtransPayload),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Jangan lanjut bila pembayaran dalam mode mock.
      if (result.mockMode) {
        setIsProcessingPayment(false);
        toast.error("Payment system configuration error. Please contact support.");
        return;
      }

      // Simpan Midtrans orderId ke store
      if (result.orderId) {
        const current = useCartStore.getState().currentTransaction;
        if (current) {
          useCartStore
            .getState()
            .setTransaction({ ...current, orderId: result.orderId });
        }
      }

      await loadMidtransScript();

      try {
        if (result.redirect_url) {
          setIsProcessingPayment(false);

          // Mode mock (non-produksi): pembayaran simulasi dianggap selesai.
          if (result.mock) {
            router.push("/order-confirmation");
            return;
          }

          // Mode nyata: arahkan ke halaman pembayaran Midtrans.
          // Order-confirmation hanya dicapai lewat callback Midtrans
          // (/payment/finish) setelah transaksi benar-benar selesai.
          window.location.href = result.redirect_url;
        } else {
          window.snap.pay(result.token, {
            onSuccess: () => {
              setIsProcessingPayment(false);
              router.push("/order-confirmation");
            },
            onPending: () => {
              setIsProcessingPayment(false);
              router.push("/payment/pending");
            },
            onError: () => {
              setIsProcessingPayment(false);
              toast.error("Pembayaran gagal. Silakan coba lagi.");
            },
            onClose: () => {
              setIsProcessingPayment(false);
            },
          });
        }
      } catch {
        setIsProcessingPayment(false);
        toast.error("Gagal membuka pembayaran. Silakan coba lagi.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessingPayment(false);
      toast.error(error?.message || "Terjadi kesalahan saat memproses pembayaran.");
    }
  };

  // ==================== LOADING & ERROR STATES ====================
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse font-medium">
        Memproses data...
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Produk tidak ditemukan.
      </div>
    );

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <header className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
            Habema Rental
          </p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-forest">
            Checkout
          </h1>
          <p className="text-sm text-stone-500 font-medium mt-1">
            Lengkapi detail sewa untuk melanjutkan — {product.name}.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Main Column: Booking Steps */}
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1: Jadwal Sewa */}
            <StepCard number={1} title="Jadwal Sewa" completed={!!(startDate && endDate)}>
              <div className="space-y-5">
                <DateRangePicker
                  onDateRangeSelect={handleDateSelect}
                  selectedStartDate={startDate || undefined}
                  selectedEndDate={endDate || undefined}
                />

                <div className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 bg-stone-50/60">
                  <MapPin className="w-5 h-5 text-forest shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-forest">Ambil di Tempat</p>
                    <p className="text-xs text-stone-500 font-medium">
                      Gratis · Basecamp Habema, Cihanjuang
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Pesan untuk Pemilik Rental{" "}
                    <span className="text-stone-400 font-medium">(Opsional)</span>
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Berikan catatan khusus, misalnya permintaan tambahan atau pertanyaan"
                    className="w-full p-3 border border-stone-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </StepCard>

            {/* Step 2: Verifikasi Identitas */}
            <StepCard
              number={2}
              title="Verifikasi Identitas"
              completed={!!idData}
              disabled={!startDate || !endDate}
            >
              <LazyWrapper>
                <LazyIDVerificationForm
                  ref={idFormRef}
                  onVerificationComplete={(data: any) => {
                    idDataRef.current = data;
                    setIdData(data);
                  }}
                  disabled={!startDate || !endDate}
                />
              </LazyWrapper>
            </StepCard>

            {/* Step 3: Metode Pembayaran */}
            <StepCard
              number={3}
              title="Metode Pembayaran"
              completed={false}
              disabled={!idData}
            >
              <div className="space-y-3">
                {[
                  {
                    id: "tf",
                    name: "Transfer Bank",
                    desc: "Verifikasi manual 10-30 menit",
                    icon: "🏦",
                    requiresAuth: true,
                  },
                  {
                    id: "qris",
                    name: "QRIS",
                    desc: "Otomatis & Instan (Gopay, OVO, Dana)",
                    icon: "📸",
                    requiresAuth: true,
                  },
                  {
                    id: "wa",
                    name: "WhatsApp Konfirmasi",
                    desc: "Tanya admin via WhatsApp",
                    icon: "💬",
                    requiresAuth: false,
                  },
                ]
                  // Guest hanya bisa pakai WhatsApp
                  .filter((m) => (user ? true : !m.requiresAuth))
                  .map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div
                        onClick={() => setPaymentMethod(m.name)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                          paymentMethod === m.name
                            ? "border-emerald-600 bg-emerald-50/50"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`text-xl p-2 rounded-lg ${
                              paymentMethod === m.name
                                ? "bg-emerald-100"
                                : "bg-slate-50"
                            }`}
                          >
                            {m.icon}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`font-bold text-sm ${
                                paymentMethod === m.name
                                  ? "text-emerald-900"
                                  : "text-slate-700"
                              }`}
                            >
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {m.desc}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === m.name
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-slate-200"
                          }`}
                        >
                          {paymentMethod === m.name && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>

                      {m.name === "Transfer Bank" &&
                        paymentMethod === "Transfer Bank" && (
                          <div className="grid grid-cols-2 gap-2 ml-4 animate-in slide-in-from-top-2">
                            {["BCA", "Mandiri", "BNI", "BRI"].map((bank) => (
                              <button
                                key={bank}
                                onClick={() => setSelectedBank(bank)}
                                className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all ${
                                  selectedBank === bank
                                    ? "border-emerald-500 bg-white text-emerald-700 shadow-sm"
                                    : "border-slate-100 bg-slate-50/50 text-slate-500"
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}

                {!user && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-[10px] text-amber-700 font-medium">
                      Note: Karena Anda belum masuk, pembayaran via Bank/QRIS tidak
                      tersedia. Silakan{" "}
                      <button
                        onClick={() => router.push("/login")}
                        className="underline font-bold text-amber-800"
                      >
                        Login di sini
                      </button>{" "}
                      untuk akses penuh.
                    </p>
                  </div>
                )}
              </div>
            </StepCard>

            {/* Step 4: Syarat & Kondisi */}
            <StepCard
              number={4}
              title="Syarat & Kondisi"
              completed={!!conditionData}
              disabled={!startDate || !endDate}
            >
              <RentalConditionsChecklist
                equipmentName={product.name}
                onChecklistComplete={(data: ConditionChecklistData) => {
                  setConditionData(data);
                  localStorage.setItem("rentalConditions", JSON.stringify(data));
                }}
              />
            </StepCard>

            {/* Tombol utama tunggal di akhir */}
            <div className="pt-2">
              <Button
                onClick={handleCheckout}
                disabled={
                  isProcessingPayment ||
                  !startDate ||
                  !endDate ||
                  !conditionData ||
                  !paymentMethod ||
                  (paymentMethod === "Transfer Bank" && !selectedBank)
                }
                className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg ${
                  isProcessingPayment ||
                  !startDate ||
                  !endDate ||
                  !conditionData ||
                  !paymentMethod ||
                  (paymentMethod === "Transfer Bank" && !selectedBank)
                    ? "bg-slate-200 text-slate-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses Pembayaran...
                  </>
                ) : paymentMethod === "WhatsApp Konfirmasi" ? (
                  "Pesan via WhatsApp"
                ) : (
                  "Bayar Sekarang"
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24">
            <Card className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 border-b border-stone-200">
                <h3 className="font-black uppercase tracking-tight text-forest text-sm">
                  Ringkasan Sewa
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {transaction?.items && transaction.items.length > 0 ? (
                  <div className="space-y-2.5 max-h-40 lg:max-h-60 overflow-y-auto">
                    {transaction.items.map((item: any, index: number) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex gap-3 items-start"
                      >
                        <OptimizedImage
                          src={
                            item.image_url ||
                            (String(item.id) === String(product?.id)
                              ? product?.image_url
                              : "") ||
                            "/placeholder.svg"
                          }
                          alt={item.name || "Produk"}
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover ring-1 ring-stone-100 shrink-0 bg-stone-50"
                          width={48}
                          height={48}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-forest line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-medium">
                            {item.quantity} unit × Rp
                            {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-forest shrink-0">
                          Rp{(item.price * item.quantity).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <OptimizedImage
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name || "Produk"}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-stone-100 shrink-0 bg-stone-50"
                      width={56}
                      height={56}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-forest line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-tight">
                        {product.equipment_categories?.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t border-stone-200">
                  {days > 0 ? (
                    <>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-stone-500">
                          {days} hari x {transaction?.items?.length || quantity} Item
                        </span>
                        <span className="text-forest font-bold">
                          Rp{subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-emerald-600">
                            Diskon ({claimedDiscount?.code})
                          </span>
                          <span className="text-emerald-600 font-bold">
                            -Rp{discountAmount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-end pt-2">
                        <span className="font-bold text-forest text-sm">Total</span>
                        <span className="font-black text-forest text-lg tracking-tight">
                          Rp{totalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-xs text-stone-500 py-2 font-medium">
                      Pilih tanggal sewa untuk melihat total harga
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Kupon Saya */}
            <Card className="mt-4 rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="p-4 border-b border-stone-200">
                <h3 className="font-black uppercase tracking-tight text-forest text-sm flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-forest" />
                  Kupon Saya
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {!user ? (
                  <p className="text-xs text-stone-500 font-medium">
                    Silakan{" "}
                    <Link
                      href="/login"
                      className="underline font-bold text-emerald-700"
                    >
                      login
                    </Link>{" "}
                    untuk melihat &amp; menggunakan kupon Anda.
                  </p>
                ) : loadingCoupons ? (
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat kupon...
                  </div>
                ) : myCoupons.length === 0 ? (
                  <div className="text-xs text-stone-500 font-medium space-y-1">
                    <p>Belum ada kupon yang diklaim.</p>
                    <Link
                      href="/bundles"
                      className="text-emerald-700 font-bold underline"
                    >
                      Lihat promo &amp; klaim kupon
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myCoupons.map((claim) => {
                      const d = claim?.discount;
                      if (!d) return null;
                      const isActive = claimedDiscount?.id === d.id;
                      const elig = getCouponEligibility(d);
                      return (
                        <button
                          key={claim.id}
                          type="button"
                          disabled={!elig.eligible}
                          onClick={() => (isActive ? clearCoupon() : applyCoupon(d))}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                            isActive
                              ? "border-emerald-600 bg-emerald-50"
                              : elig.eligible
                                ? "border-stone-200 bg-white hover:border-emerald-300"
                                : "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-forest uppercase tracking-wide">
                                {d.code}
                              </p>
                              <p className="text-[10px] text-stone-500 font-medium line-clamp-2">
                                {d.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {isActive ? (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                  Terpakai
                                </span>
                              ) : !elig.eligible ? (
                                <span className="text-[10px] font-bold text-stone-400 uppercase">
                                  {elig.reason}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                  Pakai
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
      <LoginModal
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open) {
            skipAuthCheck.current = true;
            setTimeout(() => handleFinalAction(), 0);
          }
        }}
      />
    </div>
  );
}

// ==================== STEP CARD COMPONENT ====================
function StepCard({
  number,
  title,
  completed,
  children,
  disabled,
}: any) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="p-4 sm:p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              completed ? "bg-forest text-white" : "bg-stone-200 text-stone-500"
            }`}
          >
            {completed ? <CheckCircle className="w-4 h-4" /> : number}
          </div>
          <h3 className="font-bold text-forest text-sm">{title}</h3>
        </div>
        {disabled ? (
          <div className="pl-0 sm:pl-10 text-xs text-stone-400 font-medium italic">
            Lengkapi bagian sebelumnya terlebih dahulu
          </div>
        ) : (
          <div className="pl-0 sm:pl-10">{children}</div>
        )}
      </div>
    </div>
  );
}

// ==================== PAGE WRAPPER ====================
export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse font-medium">
          Memuat halaman booking...
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
