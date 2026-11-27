"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export async function uploadGalleryImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/opentrip-content/upload", {
    method: "POST",
    body: fd,
  });
  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new Error(
      json?.error ||
        (res.status === 404
          ? "Endpoint upload tidak ditemukan. Muat ulang halaman admin lalu coba lagi."
          : raw.slice(0, 200) || `HTTP ${res.status}`),
    );
  }
  if (!json?.data?.url) throw new Error("Server tidak mengembalikan URL gambar.");
  return String(json.data.url);
}

type Props = {
  values: string[];
  onChange: (urls: string[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
};

export function ImageUploadField({ values, onChange, label, hint, multiple = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const selected = multiple ? files : files.slice(0, 1);

    for (const file of selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setUploadError("Pilih file JPEG, PNG, atau WebP.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Ukuran gambar maksimal 5 MB.");
        return;
      }
    }

    setUploading(true);
    setUploadError(null);
    setProgress({ done: 0, total: selected.length });

    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        uploaded.push(await uploadGalleryImage(file));
        setProgress({ done: uploaded.length, total: selected.length });
      }
      onChange(multiple ? [...values, ...uploaded] : uploaded);
      toast.success(
        selected.length > 1
          ? `${selected.length} gambar berhasil diunggah`
          : "Gambar berhasil diunggah",
      );
    } catch (error: any) {
      if (uploaded.length > 0) onChange(multiple ? [...values, ...uploaded] : uploaded);
      const message = error?.message || "Gagal mengunggah gambar";
      setUploadError(
        uploaded.length > 0
          ? `${uploaded.length}/${selected.length} gambar terunggah. ${message}`
          : message,
      );
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-2">
      <Label className="block text-sm">{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={inputRef as any}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading
            ? progress.total > 1
              ? `Mengunggah ${Math.min(progress.done + 1, progress.total)}/${progress.total}…`
              : "Mengunggah…"
            : multiple && values.length > 0
              ? "Tambah gambar"
              : values.length > 0
                ? "Ganti gambar"
                : "Unggah gambar"}
        </Button>
        {multiple && values.length > 0 && (
          <span className="text-xs text-muted-foreground">{values.length} gambar dipilih</span>
        )}
      </div>
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {values.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {values.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                width={320}
                height={180}
                className="w-full h-28 object-cover rounded-md border border-stone-200 bg-stone-100"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                title="Hapus gambar"
                disabled={uploading}
                onClick={() => onChange(values.filter((item) => item !== url))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {multiple ? "Belum ada gambar. Bisa pilih beberapa file sekaligus." : "Belum ada gambar. Unggah gambar baru."}
        </p>
      )}
    </div>
  );
}
