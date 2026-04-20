"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --- INTERFACES ---

export interface UserIdentity {
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  identityCardUrl?: string; 
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

interface TransactionData {
  items: any[];
  duration: number;
  payment: {
    method: string;
    bank?: string;
    accountName?: string;
    accountNumber?: string;
  };
  totalPrice: number;
}

interface CartStore {
  items: any[];
  currentTransaction: TransactionData | null;
  orders: Order[];
  identity: UserIdentity | null;
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
}

// --- STORE IMPLEMENTATION ---

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      // State awal
      items: [],
      currentTransaction: null,
      orders: [],
      identity: null,

      // Menambahkan item ke keranjang
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      // Alias untuk addItem guna memperbaiki error "addToCart is not a function"
      addToCart: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

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
    }),

    {
      name: "habema-cart-storage", // Nama key di localStorage
      storage: createJSONStorage(() => localStorage),
      
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