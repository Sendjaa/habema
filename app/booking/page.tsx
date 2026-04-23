"use client";

import { useState, Suspense, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { calculateDaysBetween } from "@/lib/booking-utils";
import { CheckCircle, ShieldCheck, Info } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { IDVerificationForm } from "@/components/checkout/id-verification-form";
import {
  RentalConditionsChecklist,
  ConditionChecklistData,
} from "@/components/checkout/rental-conditions-checklist";
import { useCartStore } from "@/lib/store";

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const quantity = parseInt(searchParams.get("quantity") || "1");

  // hybrid checkout
  const [user, setUser] = useState<User | null>(null);
  const transaction = useCartStore((state) => state.currentTransaction);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [idData, setIdData] = useState<any | null>(null);
  const [conditionData, setConditionData] =
    useState<ConditionChecklistData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
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

  const days =
    startDate && endDate ? calculateDaysBetween(startDate, endDate) : 0;
  const pricePerNight = product ? Number(product.price_per_night) : 0;
  const subtotal = pricePerNight * quantity * days;
  const deposit = Math.round(subtotal * 0.2);
  const tax = Math.round(subtotal * 0.1);
  const totalPrice = subtotal;
  const setTransactionData = useCartStore((state) => state.setTransaction);

  const handleDateSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleFinalAction = async () => {
    try {
      // 1. Ambil data user yang sedang login dari Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!productId) throw new Error("ID Produk tidak ditemukan.");
      const orderData = {
        user_id: user?.id || null, // null for anonymous users
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        rental_days: Number(days),
        subtotal: Number(subtotal),
        total_cost: Number(totalPrice),
        deposit_amount: Number(deposit),
        status: "pending",
      };

      // For anonymous users, save to database with null user_id
      if (!user) {
        console.log('Creating anonymous booking (database with null user_id)');
        
        // Create order data for anonymous user
        const anonymousOrderData = {
          user_id: null, // Explicit null for anonymous users
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
          rental_days: Number(days),
          subtotal: Number(subtotal),
          total_cost: Number(totalPrice),
          deposit_amount: Number(deposit),
          status: "pending",
        };

        // Save anonymous booking to database
        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert([anonymousOrderData])
          .select()
          .single();

        if (bookingError) {
          console.error('Error saving anonymous booking:', bookingError);
          throw bookingError;
        }

        console.log('Anonymous booking saved to database:', newBooking);

        // Save booking items
        const itemData = {
          booking_id: newBooking.id,
          equipment_id: productId,
          quantity: Number(quantity),
          unit_price: Number(pricePerNight),
          subtotal: Number(subtotal),
        };

        const { error: itemError } = await supabase
          .from("booking_items")
          .insert([itemData]);

        if (itemError) {
          console.error('Error saving booking items:', itemError);
          throw itemError;
        }

        // Create notification for admin about anonymous booking
        try {
          await supabase
            .from("notifications")
            .insert({
              user_id: null, // System notification (no specific user)
              booking_id: newBooking.id,
              title: "Booking Baru dari User Anonymous",
              message: `User anonymous melakukan booking untuk ${product?.name}. ID: ${newBooking.id.slice(0, 8)}. Total: Rp${Number(totalPrice).toLocaleString("id-ID")}. Mohon segera diproses.`,
              notification_type: "anonymous_booking",
              is_read: false
            });
          console.log('Notification created for anonymous booking');
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
          // Continue even if notification fails
        }

        // Log booking details for debugging
        console.log('=== ANONYMOUS BOOKING CREATED ===');
        console.log('Booking ID:', newBooking.id);
        console.log('Product:', product?.name);
        console.log('User Data:', idData);
        console.log('Total Price:', totalPrice);
        console.log('Duration:', days, 'days');
        console.log('Payment Method:', paymentMethod);
        console.log('=================================');
        
        // Save anonymous booking to localStorage for tracking
        const anonymousBooking = {
          id: newBooking.id, // Use database booking ID
          localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Local reference
          productId: productId,
          productName: product?.name,
          quantity: quantity,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          days: days,
          totalPrice: totalPrice,
          paymentMethod: paymentMethod,
          identityData: idData,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        
        // Get existing anonymous bookings
        const existingBookings = JSON.parse(localStorage.getItem('anonymousBookings') || '[]');
        existingBookings.push(anonymousBooking);
        localStorage.setItem('anonymousBookings', JSON.stringify(existingBookings));
        
        console.log('Anonymous booking saved to localStorage:', anonymousBooking);
        
        // Update transaction data with booking info
        setTransactionData({
          items: product,
          days: Number(days),
          duration: Number(days),
          totalPrice: Number(totalPrice),
          payment: { method: paymentMethod, bank: selectedBank || undefined },
        });

        // For anonymous users, only WhatsApp is available
        if (paymentMethod === "WhatsApp Konfirmasi") {
          const waMessage = `Halo Admin Habema!
Saya ingin menyewa: *${product.name}*
ID Booking: #${newBooking.id.slice(0, 8)}
User: Guest
Durasi: ${days} Hari
Total: Rp${Number(totalPrice).toLocaleString("id-ID")}

Data Identitas:
Nama: ${idData?.fullName || 'Guest'}
ID: ${idData?.idNumber || '-'}
Tipe: ${idData?.idType || '-'}

Mohon konfirmasi pesanan saya ya!`;

          window.open(
            `https://wa.me/628123456789?text=${encodeURIComponent(waMessage)}`,
            "_blank",
          );
        }

        router.push("/checkout");
        return;
      }

      // For authenticated users, save to database
      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert([orderData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 4. Persiapkan data untuk Tabel Booking_Items
      const itemData = {
        booking_id: newBooking.id,
        equipment_id: productId,
        quantity: Number(quantity),
        unit_price: Number(pricePerNight),
        subtotal: Number(subtotal),
      };

      const { error: itemError } = await supabase
        .from("booking_items")
        .insert([itemData]);

      if (itemError) throw itemError;

      // 5. Update Global State (Zustand)
      setTransactionData({
        items: product,
        days: Number(days),
        duration: Number(days),
        totalPrice: Number(totalPrice),
        payment: { method: paymentMethod, bank: selectedBank || undefined },
      });

      // 6. Alur Keluar (WhatsApp)
      if (paymentMethod === "WhatsApp Konfirmasi") {
        const waMessage = `Halo Admin Habema!
Saya ingin menyewa: *${product.name}*
ID Booking: #${newBooking.id.slice(0, 8)}
User: ${user ? user.email : "Guest"}
Durasi: ${days} Hari
Total: Rp${Number(totalPrice).toLocaleString("id-ID")}

Data sudah masuk ke sistem, mohon konfirmasinya ya!`;

        window.open(
          `https://wa.me/628123456789?text=${encodeURIComponent(waMessage)}`,
          "_blank",
        );
      }

      router.push("/checkout");
    } catch (error: any) {
      console.error("Error lengkap:", error);
      alert(
        `Gagal menyimpan pesanan: ${error.message || "Terjadi kesalahan sistem"}`,
      );
    }
  };

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Pesanan Berhasil!
            </h2>
            <p className="text-slate-500 text-sm">
              Tim kami akan segera memverifikasi dokumen dan pesanan Anda.
            </p>
          </div>
          <Button
            className="w-full h-12 bg-slate-900 rounded-xl font-bold"
            onClick={() => router.push("/")}
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              Secure Checkout
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Selesaikan Pembayaran
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <StepCard
              number={1}
              title="Jadwal Sewa"
              active={step === 1}
              completed={!!(startDate && endDate)}
              onEdit={() => setStep(1)}
            >
              <DateRangePicker
                onDateRangeSelect={handleDateSelect}
                selectedStartDate={startDate || undefined}
                selectedEndDate={endDate || undefined}
              />
              {startDate && endDate && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-slate-900 h-12 rounded-xl font-bold"
                >
                  Lanjutkan
                </Button>
              )}
            </StepCard>

            <StepCard
              number={2}
              title="Syarat & Kondisi"
              active={step === 2}
              completed={!!conditionData}
              onEdit={() => setStep(2)}
              disabled={!startDate || !endDate}
            >
              <RentalConditionsChecklist
                equipmentName={product.name}
                onChecklistComplete={(data: ConditionChecklistData) => {
                  setConditionData(data);
                  setStep(3);
                }}
              />
            </StepCard>

            <StepCard
              number={3}
              title="Verifikasi Identitas"
              active={step === 3}
              completed={!!idData}
              onEdit={() => setStep(3)}
              disabled={!conditionData}
            >
              <IDVerificationForm
                onVerificationComplete={(data: any) => {
                  setIdData(data);
                  setStep(4);
                }}
              />
            </StepCard>

            {/* pembayaran */}
            <StepCard
              number={4}
              title="Metode Pembayaran"
              active={step === 4}
              completed={false}
              disabled={!idData}
            >
              <div className="space-y-3">
                {/* Logika Hybrid: Filter metode berdasarkan status login */}
                {[
                  {
                    id: "tf",
                    name: "Transfer Bank",
                    desc: "Verifikasi manual 10-30 menit",
                    icon: "🏦",
                    requiresAuth: true, // Hanya untuk user login
                  },
                  {
                    id: "qris",
                    name: "QRIS",
                    desc: "Otomatis & Instan (Gopay, OVO, Dana)",
                    icon: "📸",
                    requiresAuth: true, // Hanya untuk user login
                  },
                  {
                    id: "wa",
                    name: "WhatsApp Konfirmasi",
                    desc: "Tanya admin via WhatsApp",
                    icon: "💬",
                    requiresAuth: false, // Guest & User bisa pakai ini
                  },
                ]
                  // FILTER DISINI: Jika user TIDAK login, tampilkan yang NOT requiresAuth saja
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
                              className={`font-bold text-sm ${paymentMethod === m.name ? "text-emerald-900" : "text-slate-700"}`}
                            >
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {m.desc}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.name ? "border-emerald-600 bg-emerald-600" : "border-slate-200"}`}
                        >
                          {paymentMethod === m.name && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>

                      {/* Sub-pilihan Bank (Hanya muncul jika Login & Pilih TF) */}
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

                {/* Cari bagian ini di kode kamu */}
                {!user && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-[10px] text-amber-700 font-medium">
                      Note: Karena Anda belum masuk, pembayaran via Bank/QRIS
                      tidak tersedia. Silakan{" "}
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

                <Button
                  onClick={handleFinalAction}
                  disabled={
                    !paymentMethod ||
                    (paymentMethod === "Transfer Bank" && !selectedBank)
                  }
                  className={`w-full h-14 mt-4 rounded-xl font-bold text-lg shadow-lg ${
                    paymentMethod &&
                    (paymentMethod !== "Transfer Bank" || selectedBank)
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {paymentMethod === "WhatsApp Konfirmasi"
                    ? "Pesan via WhatsApp"
                    : "Konfirmasi Pesanan"}
                </Button>
              </div>
            </StepCard>
          </div>

          <aside className="lg:col-span-4 sticky top-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden bg-white">
              <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Ringkasan Sewa
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-4">
                  <img
                    src={product.image_url}
                    className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-100"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      {product.equipment_categories?.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">
                      {days} hari x {quantity} Unit
                    </span>
                    <span className="text-slate-900">
                      Rp{subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-4">
                    <span className="font-bold text-slate-900 text-sm">
                      Total
                    </span>
                    <span className="font-extrabold text-emerald-700 text-xl tracking-tight">
                      Rp{totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  active,
  completed,
  onEdit,
  children,
  disabled,
}: any) {
  return (
    <div
      className={`p-6 rounded-2xl transition-all border ${active ? "bg-white border-slate-200 shadow-sm" : "bg-transparent border-transparent opacity-50"} ${disabled ? "grayscale" : ""}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${completed ? "bg-emerald-600 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}
        >
          {completed ? <CheckCircle className="w-5 h-5" /> : number}
        </div>
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>
        {completed && !active && (
          <button
            onClick={onEdit}
            className="ml-auto text-xs font-bold text-emerald-600"
          >
            Ubah
          </button>
        )}
      </div>
      {active && <div className="pl-0 sm:pl-12">{children}</div>}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center font-bold text-slate-200 uppercase tracking-widest">
          Loading...
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
