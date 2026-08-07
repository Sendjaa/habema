"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, MapPin, Tag, Loader2, Check, Truck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCartStore } from "@/lib/store";
import { LoginModal } from "@/components/auth/login-modal";
import { ShippingSelector } from "@/components/booking/shipping-selector";
import { toast } from "sonner";

declare global {
  interface Window {
    snap: any;
  }
}

const loadMidtransScript = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if (window.snap) return resolve(window.snap);
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === "true";
    const script = document.createElement("script");
    script.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error("Gagal memuat Snap Midtrans"));
    document.body.appendChild(script);
  });

interface FormValues {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  note: string;
  payment_method: string;
}

interface ShippingData {
  courierCode?: string;
  courierService?: string;
  shippingCost?: number;
  destinationId?: number;
  destinationLabel?: string;
}

const EMPTY_FORM: FormValues = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  note: "",
  payment_method: "bca_va",
};

const FORM_STORAGE_KEY = "habema-checkout-form";

function loadSavedForm(): FormValues {
  if (typeof window === "undefined") return EMPTY_FORM;
  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return EMPTY_FORM;
    return { ...EMPTY_FORM, ...(JSON.parse(raw) as Partial<FormValues>) };
  } catch {
    return EMPTY_FORM;
  }
}

function clearSavedForm() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FORM_STORAGE_KEY);
  } catch {}
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const claimedDiscount = useCartStore((s) => s.claimedDiscount);
  const clearClaimedDiscount = useCartStore((s) => s.clearClaimedDiscount);

  const [form, setForm] = useState<FormValues>(loadSavedForm);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        setShowLoginModal(true);
      } else {
        setUser(u);
        setForm((f) => ({ ...f, email: u.email || f.email }));
      }
    })();
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <Card className="p-12 bg-white border border-stone-200 max-w-md text-center rounded-2xl shadow-sm">
          <ShoppingBag className="w-16 h-16 mx-auto text-stone-300 mb-6" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Keranjang Kosong</h1>
          <p className="text-stone-500 mb-6">Belum ada produk di keranjang Anda.</p>
          <Button asChild className="bg-[#1B4332] text-white">
            <a href="/catalog_shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Belanja Sekarang
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  const subtotal = cart.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  let discountAmount = 0;
  if (claimedDiscount) {
    const disc = claimedDiscount;
    if (disc.discount_type === "percentage") {
      if ((disc.min_purchase || 0) <= subtotal) {
        discountAmount = (subtotal * Number(disc.discount_value)) / 100;
        if (disc.max_discount)
          discountAmount = Math.min(discountAmount, Number(disc.max_discount));
      }
    } else if (disc.discount_type === "fixed") {
      if ((disc.min_purchase || 0) <= subtotal) {
        discountAmount = Math.min(Number(disc.discount_value), subtotal);
      }
    }
  }

  const total = subtotal - discountAmount;

  const validate = () => {
    const required = [
      { k: "customer_name", v: form.customer_name },
      { k: "phone", v: form.phone },
      { k: "address", v: form.address },
      { k: "city", v: form.city },
      { k: "postal_code", v: form.postal_code },
    ];
    const missing = required.filter((r) => !String(r.v || "").trim());
    if (missing.length > 0) {
      toast.error("Isi dulu: " + missing.map((m) => m.k).join(", "));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerDetails: { ...form, user_id: user.id },
          claimedDiscount: claimedDiscount
            ? {
                id: claimedDiscount.id,
                code: claimedDiscount.code,
                discount_type: claimedDiscount.discount_type,
                discount_value: claimedDiscount.discount_value,
                min_purchase: claimedDiscount.min_purchase,
                max_discount: claimedDiscount.max_discount,
              }
            : null,
          deliveryCost: shippingData?.shippingCost || 0,
          courierName: shippingData?.courierCode
            ? `${shippingData.courierCode.toUpperCase()} ${shippingData.courierService}`
            : null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal checkout");

      // Mock mode (non-produksi)
      if (result.mock) {
        clearCart();
        clearClaimedDiscount();
        clearSavedForm();
        toast.success("Order berhasil (simulasi): " + result.paymentOrderId);
        router.push("/order-confirmation?order_id=" + result.paymentOrderId);
        return;
      }

      // COD — langsung ke konfirmasi, tanpa Midtrans
      if (form.payment_method === "cod" || result.cod) {
        clearCart();
        clearClaimedDiscount();
        clearSavedForm();
        toast.success("Order berhasil! Bayar saat barang tiba.");
        router.push(
          "/order-confirmation?order_id=" +
            (result.paymentOrderId || "") +
            "&status=pending"
        );
        return;
      }

      await loadMidtransScript();

      if (window.snap && result.token) {
        window.snap.pay(result.token, {
          onSuccess: () => {
            clearCart();
            clearClaimedDiscount();
            clearSavedForm();
            router.push("/order-confirmation");
          },
          onPending: () => {
            clearSavedForm();
            router.push(
              "/order-confirmation?order_id=" + result.paymentOrderId + "&status=pending"
            );
          },
          onError: () => {
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {},
        });
      } else if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#1B4332]" />
                  <h2 className="font-bold text-stone-800">Alamat Pengiriman &amp; Kontak</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Nama Lengkap *</Label>
                      <Input
                        value={form.customer_name}
                        onChange={(e) =>
                          setForm({ ...form, customer_name: e.target.value })
                        }
                        placeholder="cth. Budi Santoso"
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">No. HP *</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="cth. 08123456789"
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-500">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="cth. email@example.com"
                      className="h-10 border-stone-200 focus:border-[#1B4332]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-500">Alamat Lengkap *</Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Jl. Kebon Jeruk No. 123, Jakarta..."
                      className="border-stone-200 focus:border-[#1B4332] min-h-[80px] resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Kota *</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Jakarta"
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Kode Pos *</Label>
                      <Input
                        value={form.postal_code}
                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                        placeholder="11530"
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Metode</Label>
                      <select
                        value={form.payment_method}
                        onChange={(e) =>
                          setForm({ ...form, payment_method: e.target.value })
                        }
                        className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-[#1B4332] outline-none"
                      >
                        <option value="bca_va">BCA Virtual Account</option>
                        <option value="bni_va">BNI Virtual Account</option>
                        <option value="bri_va">BRI Virtual Account</option>
                        <option value="mandiri_va">Mandiri Virtual Account</option>
                        <option value="gopay">GoPay / E-Wallet</option>
                        <option value="cod">COD</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-500">Catatan (opsional)</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Mis. serahkan di depan gerbang..."
                      className="border-stone-200 focus:border-[#1B4332] min-h-60px resize-none"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-[#1B4332]" />
                  <h2 className="font-bold text-stone-800">Metode Pengiriman</h2>
                </div>
                <ShippingSelector
                  originId={31555}
                  weight={1000}
                  onShippingSelect={(data) => {
                    setShippingData(data);
                  }}
                />
              </Card>

              <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-[#1B4332]" />
                  <h2 className="font-bold text-stone-800">Produk ({cart.length})</h2>
                </div>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-stone-800 line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-400">
                          Rp{(Number(item.price) || 0).toLocaleString("id-ID")} x{" "}
                          {item.quantity}

                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-stone-300 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-white border-2 border-gold rounded-2xl shadow-xl sticky top-8">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                  <Tag className="w-5 h-5 text-[#1B4332]" />
                  <h3 className="font-bold text-stone-800">Ringkasan Pesanan</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-medium">
                      Rp{subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {claimedDiscount && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Diskon {claimedDiscount.code}</span>
                      <span>-Rp{discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}

                  {shippingData?.shippingCost && shippingData.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">
                        Ongkir ({shippingData.courierCode?.toUpperCase()} {shippingData.courierService})
                      </span>
                      <span className="font-medium">
                        Rp{shippingData.shippingCost.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-stone-200 pt-3 flex justify-between text-base">
                    <span className="text-stone-500">Total</span>
                    <span className="text-2xl font-black text-[#FF6B35]">
                      Rp{(total + (shippingData?.shippingCost || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-xl shadow-lg transition-all mt-5"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Bayar Sekarang"
                  )}
                </Button>

                {claimedDiscount && (
                  <button
                    type="button"
                    onClick={() => clearClaimedDiscount()}
                    className="mt-3 text-[11px] text-stone-400 hover:text-stone-700 underline"
                  >
                    Hapus voucher
                  </button>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Anda akan diarahkan ke halaman pembayaran aman Midtrans untuk
                    menyelesaikan transaksi.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </form>

        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </div>
    </div>
  );
}
