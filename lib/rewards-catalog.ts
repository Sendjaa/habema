export interface PromoCatalogItem {
  id: string;
  code: string;
  title: string;
  category: "rental" | "opentrip" | "shop";
  categoryLabel: string;
  discountText: string;
  coinCost: number;
  minTransaction: number;
  validDays: number;
  description: string;
}

export const PROMO_CATALOG: PromoCatalogItem[] = [
  {
    id: "promo-rental-25k",
    code: "HBM-RENT25",
    title: "Potongan Sewa Gear Rp25.000",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Diskon Rp25.000",
    coinCost: 250,
    minTransaction: 100000,
    validDays: 30,
    description:
      "Berlaku untuk seluruh penyewaan tenda, carrier, sleeping bag, dan alat masak di Pool Habema.",
  },
  {
    id: "promo-trip-50k",
    code: "HBM-TRIP50",
    title: "Cashback Open Trip Rp50.000",
    category: "opentrip",
    categoryLabel: "Open Trip",
    discountText: "Potongan Rp50.000",
    coinCost: 500,
    minTransaction: 450000,
    validDays: 45,
    description:
      "Dapat digunakan saat pelunasan atau booking DP semua jadwal Open Trip Habema.",
  },
  {
    id: "promo-rental-20pct",
    code: "HBM-GEAR20",
    title: "Diskon 20% Paket Pendakian Lengkap",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Diskon 20% (Maks. Rp40rb)",
    coinCost: 350,
    minTransaction: 150000,
    validDays: 30,
    description:
      "Khusus penyewaan minimal 3 item perlengkapan dalam satu kode pemesanan.",
  },
  {
    id: "promo-shop-15k",
    code: "HBM-SHOP15",
    title: "Voucher Belanja Logistik Rp15.000",
    category: "shop",
    categoryLabel: "Toko Outdoor",
    discountText: "Diskon Rp15.000",
    coinCost: 150,
    minTransaction: 75000,
    validDays: 30,
    description:
      "Berlaku untuk pembelian gas kaleng, makanan kering lapangan, dan aksesoris pendakian.",
  },
  {
    id: "promo-trip-100k",
    code: "HBM-SUMMIT100",
    title: "Voucher Ekspedisi Prioritas Rp100.000",
    category: "opentrip",
    categoryLabel: "Open Trip",
    discountText: "Potongan Rp100.000",
    coinCost: 950,
    minTransaction: 700000,
    validDays: 60,
    description:
      "Potongan langsung untuk kloter pendakian 3 hari 2 malam atau rute elevasi di atas 2.500 MDPL.",
  },
  {
    id: "promo-rental-free1d",
    code: "HBM-EXTRA1D",
    title: "Gratis Tambahan 1 Hari Sewa",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Gratis 1 Malam",
    coinCost: 400,
    minTransaction: 120000,
    validDays: 30,
    description:
      "Tambahan durasi sewa 24 jam tanpa biaya ekstra untuk antisipasi keterlambatan perjalanan pulang.",
  },
];
