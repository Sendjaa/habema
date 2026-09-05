export interface DBOrder {
  id: string;
  items: string[];
  total: number;
  status: string;
  payment_status: string | null;
  payment_method?: string | null;
  pickup_date: string | null;
  created_at: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  cancel_reason?: string | null;
  cancel_note?: string | null;
  item_image_url?: string | null;
}

export interface DBShopOrder {
  id: string;
  order_id: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_cost: number;
  total_amount: number;
  created_at: string;
  cancel_reason?: string | null;
  cancel_note?: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    product?: {
      name: string;
      image_url?: string;
    } | null;
  }>;
}

export interface DBAddress {
  id: string;
  user_id: string | null;
  label: string | null;
  recipient: string | null;
  phone: string | null;
  address: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateShort = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "Menunggu",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500" },
  confirmed:  { label: "Disiapkan",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500" },
  active:     { label: "Dipinjam",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  picked_up:  { label: "Dipinjam",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  returned:   { label: "Dikembalikan", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  completed:  { label: "Selesai",     color: "text-stone-700",  bg: "bg-stone-100 border-stone-200",  dot: "bg-stone-500" },
  cancelled:  { label: "Dibatalkan",  color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500" },
};

export const SHOP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "Menunggu",      color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500" },
  confirmed:  { label: "Diproses",      color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500" },
  shipped:    { label: "Dikirim",       color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  delivered:  { label: "Selesai",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  cancelled:  { label: "Dibatalkan",    color: "text-red-700",    bg: "bg-red-50 border-red-200",       dot: "bg-red-500" },
};

export const SHOP_PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "Belum Bayar", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  paid:     { label: "Lunas",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cod:      { label: "COD",         color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200" },
  refunded: { label: "Refund",      color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  failed:   { label: "Gagal",       color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  cancelled:{ label: "Batal",       color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  expired:  { label: "Kedaluwarsa", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

export const DEFAULT_NOTIF = {
  order_confirm: true,
  return_reminder: true,
  promo: false,
  whatsapp: true,
  weekly_email: false,
};
