"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, MapPin, Tag, Loader2, Check, Truck, ChevronDown } from "lucide-react";
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
  province: string;
  province_name: string;
  regency: string;
  regency_name: string;
  district: string;
  district_name: string;
  village: string;
  village_name: string;
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

interface AddressOption {
  code: string;
  name: string;
}

const EMPTY_FORM: FormValues = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  province: "",
  province_name: "",
  regency: "",
  regency_name: "",
  district: "",
  district_name: "",
  village: "",
  village_name: "",
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

  // Address cascading dropdown state
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [regencies, setRegencies] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [villages, setVillages] = useState<AddressOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

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

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("/api/address?type=province");
        const result = await res.json();
        if (result.success) {
          setProvinces(result.data.map((p: any) => ({ code: p.id, name: p.name })));
        }
      } catch {}
      setLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (!form.province) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setForm((f) => ({ ...f, regency: "", regency_name: "", district: "", district_name: "", village: "", village_name: "" }));
      return;
    }
    const loadRegencies = async () => {
      setLoadingRegencies(true);
      try {
        const res = await fetch(`/api/address?type=regency&parent_code=${form.province}`);
        const result = await res.json();
        if (result.success) {
          setRegencies(result.data.map((r: any) => ({ code: r.id, name: r.name })));
        }
      } catch {}
      setLoadingRegencies(false);
    };
    loadRegencies();
  }, [form.province]);

  // Load districts when regency changes
  useEffect(() => {
    if (!form.regency) {
      setDistricts([]);
      setVillages([]);
      setForm((f) => ({ ...f, district: "", district_name: "", village: "", village_name: "" }));
      return;
    }
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`/api/address?type=district&parent_code=${form.regency}`);
        const result = await res.json();
        if (result.success) {
          setDistricts(result.data.map((d: any) => ({ code: d.id, name: d.name })));
        }
      } catch {}
      setLoadingDistricts(false);
    };
    loadDistricts();
  }, [form.regency]);

  // Load villages when district changes
  useEffect(() => {
    if (!form.district) {
      setVillages([]);
      setForm((f) => ({ ...f, village: "", village_name: "" }));
      return;
    }
    const loadVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await fetch(`/api/address?type=village&parent_code=${form.district}`);
        const result = await res.json();
        if (result.success) {
          setVillages(result.data.map((v: any) => ({ code: v.id, name: v.name })));
        }
      } catch {}
      setLoadingVillages(false);
    };
    loadVillages();
  }, [form.district]);

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
      { k: "province", v: form.province },
      { k: "regency", v: form.regency },
      { k: "district", v: form.district },
      { k: "village", v: form.village },
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

  // Payment method options dengan label yang lebih lengkap
  const paymentMethods = [
    { value: "bca_va", label: "BCA Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking BCA" },
    { value: "bni_va", label: "BNI Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking BNI" },
    { value: "bri_va", label: "BRI Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking BRI" },
    { value: "mandiri_va", label: "Mandiri Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking Mandiri" },
    { value: "permata_va", label: "Permata Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking Permata" },
    { value: "bsi_va", label: "BSI Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking Bank Syariah Indonesia" },
    { value: "cimb_va", label: "CIMB Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking CIMB Niaga" },
    { value: "maybank_va", label: "Maybank Virtual Account", desc: "Transfer via ATM/Mobile/Internet Banking Maybank" },
    { value: "gopay", label: "GoPay / E-Wallet", desc: "Bayar via aplikasi GoPay" },
    { value: "shopeepay", label: "ShopeePay", desc: "Bayar via aplikasi ShopeePay" },
    { value: "dana", label: "DANA", desc: "Bayar via aplikasi DANA" },
    { value: "ovo", label: "OVO", desc: "Bayar via aplikasi OVO" },
    { value: "linkaja", label: "LinkAja", desc: "Bayar via aplikasi LinkAja" },
    { value: "credit_card", label: "Kartu Kredit / Debit", desc: "Visa, Mastercard, JCB" },
    { value: "qris", label: "QRIS", desc: "Scan QR code via aplikasi e-wallet/banking" },
    { value: "alfamart", label: "Alfamart", desc: "Bayar di kasir Alfamart (kode pembayaran)" },
    { value: "indomaret", label: "Indomaret", desc: "Bayar di kasir Indomaret (kode pembayaran)" },
    { value: "cod", label: "COD (Bayar di Tempat)", desc: "Bayar tunai saat barang diterima" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-sans font-bold text-stone-800 mb-8">Checkout</h1>

        <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-[#1B4332]" />
            <h2 className="font-bold font-sans text-stone-800">Produk ({cart.length})</h2>
          </div>
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <a
                  href={`/product/${item.id}`}
                  className="shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden border border-stone-200">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </a>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/product/${item.id}`}
                    className="font-medium text-stone-800 hover:text-[#1B4332] transition-colors line-clamp-1 block"
                  >
                    {item.name}
                  </a>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Rp{(Number(item.price) || 0).toLocaleString("id-ID")} x{" "}
                    <span className="font-medium text-stone-700">{item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-6 h-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="ml-1 w-6 h-6 rounded bg-stone-100 text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#1B4332]" />
                  <h2 className="font-bold font-sans text-stone-800">Alamat Pengiriman & Kontak</h2>
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
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">No. HP *</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                        className="h-10 border-stone-200 focus:border-[#1B4332]"
                        required
                      />
                  </div>

                  {/* Cascading Dropdown: Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Provinsi *</Label>
                      <Select
                        value={form.province}
                        onValueChange={(value) => {
                          setForm((f) => ({
                            ...f,
                            province: value,
                            province_name: provinces.find((p) => p.code === value)?.name || "",
                            regency: "",
                            regency_name: "",
                            district: "",
                            district_name: "",
                            village: "",
                            village_name: "",
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full h-10 border-stone-200 focus:border-[#1B4332]" disabled={loadingProvinces}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Kabupaten / Kota *</Label>
                      <Select
                        value={form.regency}
                        onValueChange={(value) => {
                          setForm((f) => ({
                            ...f,
                            regency: value,
                            regency_name: regencies.find((r) => r.code === value)?.name || "",
                            district: "",
                            district_name: "",
                            village: "",
                            village_name: "",
                          }));
                        }}
                        disabled={!form.province || loadingRegencies}
                      >
                        <SelectTrigger className="w-full h-10 border-stone-200 focus:border-[#1B4332]" disabled={!form.province || loadingRegencies}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {regencies.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Kecamatan *</Label>
                      <Select
                        value={form.district}
                        onValueChange={(value) => {
                          setForm((f) => ({
                            ...f,
                            district: value,
                            district_name: districts.find((d) => d.code === value)?.name || "",
                            village: "",
                            village_name: "",
                          }));
                        }}
                        disabled={!form.regency || loadingDistricts}
                      >
                        <SelectTrigger className="w-full h-10 border-stone-200 focus:border-[#1B4332]" disabled={!form.regency || loadingDistricts}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Desa / Kelurahan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-stone-500">Desa / Kelurahan *</Label>
                      <Select
                        value={form.village}
                        onValueChange={(value) => {
                          setForm((f) => ({
                            ...f,
                            village: value,
                            village_name: villages.find((v) => v.code === value)?.name || "",
                          }));
                        }}
                        disabled={!form.district || loadingVillages}
                      >
                        <SelectTrigger className="w-full h-10 border-stone-200 focus:border-[#1B4332]" disabled={!form.district || loadingVillages}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {villages.map((v) => (
                            <SelectItem key={v.code} value={v.code}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-stone-500">Alamat Lengkap *</Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="border-stone-200 focus:border-[#1B4332] min-h-[80px] resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-stone-500">Kode Pos *</Label>
                      <Input
                        value={form.postal_code}
                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                        className="h-10 border-stone-200 focus-border-[#1B4332]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-500">Catatan (opsional)</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="border-stone-200 focus:border-[#1B4332] min-h-[60px] resize-none"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-[#1B4332]" />
                  <h2 className="font-bold font-sans text-stone-800">Metode Pengiriman & Pembayaran</h2>
                </div>
                <ShippingSelector
                  originId={31555}
                  weight={1000}
                  onShippingSelect={(data) => {
                    setShippingData(data);
                  }}
                />
                <div className="mt-6 space-y-1.5">
                  <Label className="text-xs text-stone-500">Metode Pembayaran *</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(value) => setForm({ ...form, payment_method: value })}
                  >
                    <SelectTrigger className="w-full h-10 border-stone-200 focus:border-[#1B4332]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pm.label}</span>
                            <span className="text-[10px] text-stone-500">{pm.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-white border-2 border-gold rounded-2xl shadow-xl sticky top-8 lg:top-24">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                  <Tag className="w-5 h-5 text-[#1B4332]" />
                  <h3 className="font-bold  font-sans text-stone-800">Ringkasan Pesanan</h3>
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
                    Anda akan diarahkan ke halaman pembayaran yang aman untuk menyelesaikan transaksi.
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