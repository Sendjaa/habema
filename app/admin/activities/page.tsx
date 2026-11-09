"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ImageOff, Save, Upload } from "lucide-react";
import { toast } from "sonner";

/**
 * Kurasi foto tile kegiatan di homepage.
 *
 * Foto masuk lewat pemilih file, bukan dengan menempel URL: yang tersimpan
 * adalah file yang benar-benar ada di Storage (atau di public/uploads saat dev
 * lokal), jadi tile tidak mungkin menunjuk alamat yang mati.
 *
 * Hanya gambarnya yang diurus di sini; nama kegiatan, teks, dan urutan masih
 * ditentukan lib/activities.ts supaya filter katalog dan tile tidak bisa
 * berbeda.
 */

interface Tile {
  slug: string;
  label: string;
  blurb: string;
  display_order: number;
  image_url: string | null;
  image_alt: string | null;
  is_active: boolean;
  fallback_image: string;
}

const MAX_SIZE = 3 * 1024 * 1024;

export default function ActivityTilesManagement() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [alts, setAlts] = useState<Record<string, string>>({});
  const [actives, setActives] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchTiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activities");
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Gagal memuat kegiatan");
      const data: Tile[] = result.data ?? [];
      setTiles(data);
      setAlts(Object.fromEntries(data.map((t) => [t.slug, t.image_alt ?? ""])));
      setActives(Object.fromEntries(data.map((t) => [t.slug, t.is_active])));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kegiatan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiles();
  }, [fetchTiles]);

  const handleFile = async (tile: Tile, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar (JPG, PNG, WebP)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File terlalu besar — maksimal 3MB");
      return;
    }

    setBusy(tile.slug);
    try {
      const form = new FormData();
      form.append("slug", tile.slug);
      form.append("file", file);
      if (alts[tile.slug]?.trim()) form.append("image_alt", alts[tile.slug].trim());

      const res = await fetch("/api/admin/activities", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengunggah foto");
      toast.success(`Foto "${tile.label}" diunggah`);
      await fetchTiles();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
      const input = fileInputs.current[tile.slug];
      if (input) input.value = "";
    }
  };

  const handleSave = async (tile: Tile) => {
    setBusy(tile.slug);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tile.slug,
          image_alt: alts[tile.slug] ?? "",
          is_active: actives[tile.slug] ?? tile.is_active,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan perubahan");
      toast.success(`Perubahan "${tile.label}" disimpan`);
      await fetchTiles();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  };

  const shown = tiles.filter((t) => t.image_url && t.is_active).length;

  return (
    <div className="min-h-screen bg-[#F1EFE8]">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3">
          <h1
            className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Foto Kegiatan
          </h1>
          <p className="text-[10px] text-stone-400">
            Tile &quot;Mau ke mana dulu?&quot; di homepage — {shown} dari {tiles.length} kegiatan
            punya foto sendiri
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tiles.map((tile) => {
              const alt = alts[tile.slug] ?? "";
              const active = actives[tile.slug] ?? tile.is_active;
              const preview = (tile.image_url && active ? tile.image_url : tile.fallback_image) || "";
              const dirty = alt !== (tile.image_alt ?? "") || active !== tile.is_active;

              return (
                <Card key={tile.slug} className="p-4 border-stone-200 rounded-xl bg-white">
                  <div className="flex gap-3">
                    <div className="relative w-28 shrink-0 aspect-[4/5] rounded-lg overflow-hidden bg-stone-100">
                      <Image
                        src={preview}
                        alt={alt || tile.label}
                        fill
                        sizes="112px"
                        // unoptimized: preview harus tetap tampil untuk file
                        // yang baru saja diunggah, sebelum URL-nya pasti.
                        unoptimized
                        className="object-cover"
                      />
                      {tile.image_url && !active && (
                        <div className="absolute inset-0 bg-stone-900/45 flex items-center justify-center">
                          <ImageOff className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-800 truncate">{tile.label}</p>
                        {tile.image_url && tile.is_active ? (
                          <Badge className="text-[9px] shrink-0 bg-emerald-100 text-emerald-700">
                            Foto kurasi
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] shrink-0 bg-stone-100 text-stone-500">
                            Foto default
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 truncate">
                        /catalog_rental?kegiatan={tile.slug}
                      </p>

                      <input
                        ref={(el) => {
                          fileInputs.current[tile.slug] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(tile, e.target.files?.[0] ?? null)}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() => fileInputs.current[tile.slug]?.click()}
                          className="h-8 px-3 text-xs rounded-lg border-stone-300 text-stone-700"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {busy === tile.slug
                            ? "Mengunggah..."
                            : tile.image_url
                              ? "Ganti foto"
                              : "Pilih foto"}
                        </Button>
                        <span className="text-[10px] text-stone-400">JPG/PNG/WebP, maks 3MB</span>
                      </div>

                      <div>
                        <Label className="text-[10px] text-stone-500">Teks alternatif</Label>
                        <Input
                          value={alt}
                          onChange={(e) => setAlts((prev) => ({ ...prev, [tile.slug]: e.target.value }))}
                          placeholder={tile.label}
                          className="mt-1 h-9 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={active}
                            disabled={!tile.image_url}
                            onChange={(e) =>
                              setActives((prev) => ({ ...prev, [tile.slug]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded accent-emerald-600 disabled:opacity-40"
                          />
                          Pakai foto ini
                        </label>
                        <Button
                          size="sm"
                          onClick={() => handleSave(tile)}
                          disabled={busy !== null || !dirty}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:bg-stone-300"
                        >
                          {dirty ? (
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {busy === tile.slug ? "Menyimpan..." : dirty ? "Simpan" : "Tersimpan"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-stone-400 mt-6">
          File yang dipilih disimpan ke bucket Storage <code>activities</code> dan langsung
          dipakai di homepage. Kegiatan tanpa foto terkurasi memakai gambar default; nama, teks,
          dan urutan kegiatan tidak bisa diubah di sini — itu hidup di{" "}
          <code>lib/activities.ts</code>.
        </p>
      </div>
    </div>
  );
}
