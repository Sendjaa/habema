"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";

// Satu baris Include/Exclude di form admin bundle.
// - equipment_id terisi  => baris terhubung katalog (ikut cek/kurangi stok,
//   khusus Include). label boleh tetap diedit manual, link tidak putus.
// - equipment_id kosong  => baris kustom/teks bebas (mis. jasa, tiket).
// - qty null/undefined   => tanpa pcs (tampil label saja).
export type BundleLineRow = {
  key: string;
  label: string;
  equipment_id: string | null;
  price_per_night: number;
  qty: number | null;
};

let rowSeq = 0;

export function newBundleRow(partial: Partial<BundleLineRow> = {}): BundleLineRow {
  rowSeq += 1;
  return {
    key: `row-${Date.now()}-${rowSeq}`,
    label: "",
    equipment_id: null,
    price_per_night: 0,
    qty: null,
    ...partial,
  };
}

export function normalizeName(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

// Parse baris teks lama ("1 Tenda kap 4", "Tenda × 2 pcs") jadi label + qty.
// Best-effort: admin memverifikasi ulang di form.
export function parseLegacyLine(line: string): { label: string; qty: number | null } {
  let s = line.trim();
  let qty: number | null = null;
  let m = s.match(/[×x]\s*(\d+)\s*(pcs)?\s*$/i);
  if (m) {
    qty = parseInt(m[1], 10);
    s = s.slice(0, m.index).trim();
  } else {
    m = s.match(/^(\d+)\s*[x×]\s+(.+)$/i);
    if (m) {
      qty = parseInt(m[1], 10);
      s = m[2].trim();
    } else {
      m = s.match(/^(\d+)\s+(.+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n > 0 && n <= 1000) {
          qty = n;
          s = m[2].trim();
        }
      }
    }
  }
  return { label: s, qty };
}

export function rowsFromLegacyList(v: unknown): BundleLineRow[] {
  const list: string[] = Array.isArray(v)
    ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean)
    : typeof v === "string"
      ? v.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
  return list.map((line) => {
    const { label, qty } = parseLegacyLine(line);
    return newBundleRow({ label, qty });
  });
}

// Serialisasi ke string[] untuk kolom bundles.includes/excludes.
// "× N pcs" hanya ditampilkan bila qty > 1 (pcs opsional).
export function serializeBundleRows(rows: BundleLineRow[]): string[] {
  const out: string[] = [];
  for (const r of rows) {
    const label = r.label.trim();
    if (!label) continue;
    if (r.qty != null && r.qty > 1) out.push(`${label} × ${r.qty} pcs`);
    else out.push(label);
  }
  return out;
}

// Gabungkan bundle_items (ground truth stok) ke baris teks:
// cocokkan by nama alat; yang cocok jadi baris ter-link, sisanya ditambah.
export function mergeBundleItemsIntoRows(
  rows: BundleLineRow[],
  items: { equipment_id: string; name: string; price: number; quantity: number }[],
): BundleLineRow[] {
  const next = rows.map((r) => ({ ...r }));
  const used = new Set<number>();
  for (const it of items) {
    const idx = next.findIndex(
      (r, i) =>
        !used.has(i) &&
        !r.equipment_id &&
        r.label.trim() !== "" &&
        normalizeName(r.label) === normalizeName(it.name),
    );
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        equipment_id: it.equipment_id,
        price_per_night: it.price,
        qty: it.quantity,
      };
      used.add(idx);
    } else if (!next.some((r) => r.equipment_id === it.equipment_id)) {
      next.push(
        newBundleRow({
          label: it.name,
          equipment_id: it.equipment_id,
          price_per_night: it.price,
          qty: it.quantity,
        }),
      );
    }
  }
  return next.length > 0 ? next : [newBundleRow()];
}

export async function searchEquipment(query: string, limit = 8): Promise<any[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=${limit}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && json.success ? json.data || [] : [];
}

type Props = {
  title: string;
  hint?: string;
  rows: BundleLineRow[];
  onChange: (rows: BundleLineRow[]) => void;
  // qty bawaan saat memilih alat dari katalog (Include: 1, Exclude: null)
  defaultQty?: number | null;
  namePlaceholder?: string;
};

export function BundleListEditor({
  title,
  hint,
  rows,
  onChange,
  defaultQty = 1,
  namePlaceholder = "cth. Tenda kap 4",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        setResults(await searchEquipment(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const updateRow = (key: string, patch: Partial<BundleLineRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeRow = (key: string) => onChange(rows.filter((r) => r.key !== key));

  const unlinkRow = (key: string) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, equipment_id: null, price_per_night: 0 } : r)));

  const pickEquipment = (eq: any) => {
    const id = String(eq.id);
    const name = String(eq.name || "Alat");
    const price = Number(eq.price_per_night) || 0;
    const byId = rows.find((r) => r.equipment_id === id);
    if (byId) {
      toast.info("Alat sudah ada di daftar");
      setQuery("");
      setResults([]);
      return;
    }
    const byName = rows.find((r) => !r.equipment_id && normalizeName(r.label) === normalizeName(name));
    if (byName) {
      // Upgrade baris teks yang namanya sama menjadi ter-link katalog.
      onChange(
        rows.map((r) =>
          r.key === byName.key
            ? { ...r, equipment_id: id, price_per_night: price, qty: r.qty ?? defaultQty }
            : r,
        ),
      );
    } else {
      onChange([...rows, newBundleRow({ label: name, equipment_id: id, price_per_night: price, qty: defaultQty })]);
    }
    setQuery("");
    setResults([]);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-2.5">
      <div>
        <Label className="text-xs text-stone-600 font-semibold">{title}</Label>
        {hint && <p className="text-[11px] text-stone-500 mt-0.5">{hint}</p>}
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-stone-400">Belum ada baris. Tambah lewat pencarian alat atau baris kustom.</p>
      )}

      {rows.map((row) => (
        <div key={row.key} className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              value={row.label}
              onChange={(e) => updateRow(row.key, { label: e.target.value })}
              placeholder={namePlaceholder}
              className="h-9 text-sm flex-1 min-w-0"
            />
            <Input
              value={row.qty == null ? "" : String(row.qty)}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v === "") return updateRow(row.key, { qty: null });
                const n = Math.round(Number(v));
                if (!Number.isFinite(n) || n < 1) return;
                updateRow(row.key, { qty: n });
              }}
              inputMode="numeric"
              placeholder="pcs"
              title="Jumlah (pcs) — opsional"
              className="h-9 w-[72px] text-sm text-center shrink-0"
            />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label="Hapus baris"
              className="w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 min-h-[18px]">
            {row.equipment_id ? (
              <>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Terkatalog
                  {row.price_per_night > 0 && (
                    <span className="font-medium">· Rp{row.price_per_night.toLocaleString("id-ID")}/mlm</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => unlinkRow(row.key)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-amber-700"
                  title="Lepas link katalog (jadi teks bebas, tidak potong stok)"
                >
                  <Unlink className="w-3 h-3" /> Lepas link
                </button>
              </>
            ) : (
              <span className="text-[10px] text-stone-400">Teks bebas — tidak memotong stok</span>
            )}
          </div>
        </div>
      ))}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari alat katalog untuk ditambah (min. 2 huruf)..."
          className="pl-9 h-10 bg-white rounded-lg text-sm"
        />
        {searching && <p className="text-[11px] text-stone-400 mt-1">Mencari...</p>}
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {results.map((eq: any) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => pickEquipment(eq)}
                className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between gap-2"
              >
                <span className="text-xs font-medium text-stone-800 truncate">{eq.name}</span>
                <span className="text-[11px] text-stone-400 shrink-0">
                  Rp{Number(eq.price_per_night || 0).toLocaleString("id-ID")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...rows, newBundleRow()])}
        className="w-full rounded-lg text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah baris kustom
      </Button>
    </div>
  );
}
