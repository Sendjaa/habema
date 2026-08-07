"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LocationData } from "@/lib/indonesia-regions";

// --- INTERFACES ---

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  weight_score: number; // 1 (kecil), 5 (sedang), 10 (besar)
  brand?: string;
  capacity?: string;
  [key: string]: any;
}

export interface UserIdentity {
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  identityCardUrl?: string; 
  idType?: string;
  idNumber?: string;
  photoUrl?: string;
  verified?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status:
    | "pending"
    | "confirmed"
    | "ready"
    | "picked-up"
    | "returned"
    | "completed";
  items: string[];
  pickup_date: string;
  return_date: string;
  total: number;
  qr_code: string;
  image_url?: string;
}

export interface TransactionData {
  items: any[];
  duration: number;
  days: number;
  orderId?: string;
  payment: {
    method: string;
    bank?: string;
    accountName?: string;
    accountNumber?: string;
  };
  totalPrice: number;
  delivery?: {
    option: string;
    address: string | null;
    note: string | null;
    cost?: number;
    distance?: number;
    duration?: string | null;
    breakdown?: {
      baseCost: number;
      distanceCost: number;
      volumeSurcharge: number;
      vehicleType: 'motor' | 'car';
      surcharge?: number;
    };
  };
  dates?: {
    start: string | undefined;
    end: string | undefined;
  };
  pickupBranch?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
  } | null;
  returnBranch?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
  } | null;
}

export interface ClaimedDiscount {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  applies_to: 'all' | 'category' | 'equipment';
  target_id: string | null;
  claimed_at: string;
}

interface CartStore {
  items: any[];
  currentTransaction: TransactionData | null;
  orders: Order[];
  identity: UserIdentity | null;
  location: LocationData | null;
  claimedDiscount: ClaimedDiscount | null;
  addItem: (item: any) => void;
  addToCart: (item: any) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  setTransaction: (data: TransactionData) => void;
  clearTransaction: () => void;
  addOrder: (order: Order) => void;
  // --- FITUR BARU: Hapus & Bersihkan Pesanan ---
  removeOrder: (id: string) => void; 
  clearOrders: () => void;
  // --------------------------------------------
  setIdentity: (data: UserIdentity) => void;
  setLocation: (data: LocationData) => void;
  clearLocation: () => void;
  setClaimedDiscount: (discount: ClaimedDiscount | null) => void;
  clearClaimedDiscount: () => void;
  // --- FITUR BARU: Perhitungan Weight Score ---
  getTotalWeightScore: () => number;
  getRecommendedVehicle: () => 'motor' | 'car';
  // --------------------------------------------
}

// --- STORE IMPLEMENTATION ---

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State awal
      items: [],
      currentTransaction: null,
      orders: [],
      identity: null,
      location: null,
      claimedDiscount: null,

      // Menambahkan item ke keranjang (gabung jika id sudah ada)
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      quantity:
                        Math.max(1, Number(i.quantity) || 1) +
                        Math.max(1, Number(item.quantity) || 1),
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      // Alias untuk addItem guna memperbaiki error "addToCart is not a function"
      addToCart: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      quantity:
                        Math.max(1, Number(i.quantity) || 1) +
                        Math.max(1, Number(item.quantity) || 1),
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      // Menghapus item dari keranjang
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      // Menghapus semua item dari keranjang
      clearCart: () => set({ items: [] }),

      // Memperbarui kuantitas item di keranjang
      updateItemQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),

      // Mengatur data transaksi yang sedang berlangsung (sebelum checkout)
      setTransaction: (data) => set({ currentTransaction: data }),
      
      // Menghapus data transaksi sementara
      clearTransaction: () => set({ currentTransaction: null }),
      
      // Menambahkan pesanan baru ke riwayat dengan validasi ID unik
      addOrder: (order) =>
        set((state) => {
          const exists = state.orders.find((o) => o.id === order.id);
          if (exists) {
            console.warn("Pesanan dengan ID ini sudah ada, mengabaikan duplikat.");
            return state;
          }
          return {
            orders: [order, ...state.orders],
          };
        }),

      /**
       * FUNGSI BARU: Menghapus satu pesanan berdasarkan ID
       * Digunakan jika user ingin menghapus pesanan yang double secara manual
       */
      removeOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== id),
        })),

      /**
       * FUNGSI BARU: Mengosongkan seluruh riwayat pesanan
       * Gunakan ini jika ingin reset total data orders di localStorage
       */
      clearOrders: () => set({ orders: [] }),

      // Menyimpan data identitas penyewa (KTP, dll)
      setIdentity: (data) => set({ identity: data }),
      
      // Menyimpan data lokasi pengantaran
      setLocation: (data) => set({ location: data }),
      
      // Menghapus data lokasi
      clearLocation: () => set({ location: null }),

      // Klaim diskon
      setClaimedDiscount: (discount) => set({ claimedDiscount: discount }),
      clearClaimedDiscount: () => set({ claimedDiscount: null }),

      // --- FITUR BARU: Perhitungan Weight Score ---
      getTotalWeightScore: () => {
        const state = get();
        return state.items.reduce((total: number, item: any) => {
          const weightScore = item.weight_score || 1; // Default to 1 if not set
          const quantity = item.quantity || 1;
          return total + (weightScore * quantity);
        }, 0);
      },

      getRecommendedVehicle: () => {
        const totalWeightScore = get().getTotalWeightScore();
        return totalWeightScore > 50 ? 'car' : 'motor';
      },
      // --------------------------------------------
    }),

    {
      name: "habema-cart-storage", // Nama key di localStorage
      storage: createJSONStorage(() => localStorage),

      // Bersihkan duplikat item (id sama) yang tersimpan lama di localStorage
      merge: (persistedState: any, currentState: CartStore): CartStore => {
        const seen = new Map<string, any>();
        const persistedItems: any[] = Array.isArray(persistedState?.items)
          ? persistedState.items
          : [];
        const currentItems: any[] = Array.isArray(currentState?.items)
          ? currentState.items
          : [];
        for (const item of [...persistedItems, ...currentItems]) {
          if (!item || item.id == null) continue;
          const existing = seen.get(item.id);
          if (existing) {
            existing.quantity =
              Math.max(1, Number(existing.quantity) || 1) +
              Math.max(1, Number(item.quantity) || 1);
          } else {
            seen.set(item.id, { ...item });
          }
        }
        return {
          ...currentState,
          ...persistedState,
          items: Array.from(seen.values()),
        };
      },
      
      // Callback untuk memantau proses sinkronisasi data dari localStorage ke aplikasi
      onRehydrateStorage: (state) => {
        console.log("Hydration: Memuat data dari storage...");
        return (state, error) => {
          if (error) {
            console.error("Hydration Error:", error);
          } else {
            console.log("Hydration Success: Data tersinkronisasi.");
          }
        };
      },
    }
  )
);