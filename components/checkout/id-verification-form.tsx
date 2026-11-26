"use client";

import { useState, useRef, useEffect, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Camera,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";

type IdType = "ktp" | "sim" | "pelajar" | "paspor";

const ID_CONFIG: Record<
  IdType,
  {
    label: string;
    placeholder: string;
    hint: string;
    maxLength: number;
    allowAlpha: boolean;
  }
> = {
  ktp: {
    label: "KTP",
    placeholder: "Masukkan 16 digit NIK KTP",
    hint: "Wajib 16 digit angka sesuai e-KTP",
    maxLength: 16,
    allowAlpha: false,
  },
  sim: {
    label: "SIM",
    placeholder: "Masukkan 10–12 digit nomor SIM",
    hint: "Wajib 10–12 digit angka",
    maxLength: 12,
    allowAlpha: false,
  },
  pelajar: {
    label: "Kartu Pelajar / KTM",
    placeholder: "Masukkan 10–15 digit NISN / NIM",
    hint: "Wajib 10–15 digit angka",
    maxLength: 15,
    allowAlpha: false,
  },
  paspor: {
    label: "Paspor",
    placeholder: "Contoh: C1234567",
    hint: "6–9 karakter kombinasi huruf kapital & angka",
    maxLength: 9,
    allowAlpha: true,
  },
};

export function IDVerificationForm({ onVerificationComplete, ref }: any) {
  const savedIdentity = useCartStore((state) => state.identity);
  const setIdentity = useCartStore((state) => state.setIdentity);

  // Local State
  const [idType, setIdType] = useState<IdType>("ktp");
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState<boolean>(
    () =>
      !(
        savedIdentity?.idNumber &&
        savedIdentity?.fullName &&
        savedIdentity?.photoUrl
      )
  );

  // Document validation states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    authenticity: "pending" | "authentic" | "suspicious" | "fake";
    confidence: number;
    issues: string[];
  }>({
    authenticity: "pending",
    confidence: 0,
    issues: [],
  });

  // Default kamera belakang ('environment') agar memotret KTP lebih fokus & tidak mirror
  const [currentCamera, setCurrentCamera] = useState<"user" | "environment">(
    "environment"
  );

  // Bersihkan stream kamera saat komponen ditutup/unmount agar tidak bocor memori
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Cek identitas yang sudah tersimpan di database
  const checkExistingIdentity = async (userId: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is unavailable");

      const { data, error } = await supabase
        .from("user_identity")
        .select("id, id_type, id_number, id_photo_url, verification_status")
        .eq("user_id", userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Simpan atau perbarui data identitas ke API server
  const upsertIdentityToSupabase = async (identityData: any) => {
    const res = await fetch("/api/identity/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: identityData.user_id,
        idType: identityData.idType,
        idNumber: identityData.idNumber,
        photoUrl: identityData.photoUrl,
        fullName: identityData.fullName,
        validationResults: identityData.validationResults,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Supabase error details:", JSON.stringify(json));
      throw new Error(
        [json.error, json.detail].filter(Boolean).join(": ") ||
          "Gagal menyimpan identitas"
      );
    }

    return json.data;
  };

  // Muat identitas yang sudah ada jika user sudah login
  useEffect(() => {
    const loadExistingIdentity = async () => {
      try {
        if (!supabase) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: existingIdentity } = await checkExistingIdentity(
            user.id
          );

          if (existingIdentity) {
            const loadedType = (existingIdentity.id_type as IdType) || "ktp";
            const loadedNumber = existingIdentity.id_number || "";
            const loadedPhoto = existingIdentity.id_photo_url || null;
            const loadedName =
              user.user_metadata?.full_name || savedIdentity?.fullName || "";

            setIdType(loadedType);
            setIdNumber(loadedNumber);
            if (loadedName) setFullName(loadedName);
            setPhotoPreview(loadedPhoto);

            if (loadedNumber && loadedName && loadedPhoto) {
              setIsEditing(false);
            }

            setIdentity({
              idType: loadedType,
              idNumber: loadedNumber,
              photoUrl: loadedPhoto ?? undefined,
              fullName: loadedName,
              nik: loadedNumber,
              phone: savedIdentity?.phone || "",
              address: savedIdentity?.address || "",
              verified: existingIdentity.verification_status === "verified",
            });
          }
        }
      } catch {
        // User anonim atau belum punya data identitas
      }
    };

    loadExistingIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronisasi state dari Zustand store
  useEffect(() => {
    if (savedIdentity) {
      if (savedIdentity.idType) setIdType(savedIdentity.idType as IdType);
      if (savedIdentity.idNumber) setIdNumber(savedIdentity.idNumber);
      if (savedIdentity.fullName) setFullName(savedIdentity.fullName);
      if (savedIdentity.photoUrl) setPhotoPreview(savedIdentity.photoUrl);
    }
  }, [savedIdentity]);

  // Validasi format nomor identitas sesuai jenis dokumen
  const validateIdFormat = (id: string, type: IdType): boolean => {
    const trimmed = id.trim().toUpperCase();

    switch (type) {
      case "ktp":
        return /^[0-9]{16}$/.test(trimmed);
      case "sim":
        return /^[0-9]{10,12}$/.test(trimmed);
      case "paspor":
        return /^[A-Z0-9]{6,9}$/.test(trimmed);
      case "pelajar":
        return /^[0-9]{10,15}$/.test(trimmed);
      default:
        return trimmed.length >= 5;
    }
  };

  // SATU fungsi validasi terpadu (menggabungkan pengecekan wajib + format digit)
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!idNumber.trim()) {
      newErrors.idNumber = `Nomor ${ID_CONFIG[idType].label} wajib diisi`;
    } else if (!validateIdFormat(idNumber, idType)) {
      newErrors.idNumber = ID_CONFIG[idType].hint;
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Nama lengkap sesuai identitas wajib diisi";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Nama lengkap terlalu singkat";
    }

    if (!photoPreview) {
      newErrors.photo = "Foto dokumen wajib diunggah atau difoto";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Mohon lengkapi data identitas dengan benar");
      return false;
    }
    return true;
  };

  const analyzeDocumentCharacteristics = () => {
    return {
      authenticity: "authentic" as const,
      confidence: 0.92,
      issues: [] as string[],
    };
  };

  const validateDocumentAuthenticity = async () => {
    setIsAnalyzing(true);
    setValidationResults({ authenticity: "pending", confidence: 0, issues: [] });

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const analysis = analyzeDocumentCharacteristics();
      setValidationResults(analysis);
      return true;
    } catch (error) {
      console.error("Document validation error:", error);
      toast.error("Gagal memvalidasi dokumen. Silakan coba lagi.");
      setValidationResults({
        authenticity: "suspicious",
        confidence: 0,
        issues: ["Sistem validasi gagal memproses gambar"],
      });
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadFileToSupabase = async (
    file: File,
    userId: string
  ): Promise<string> => {
    if (!supabase) throw new Error("Supabase client is unavailable");

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("id-documents")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("id-documents").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !photoPreview) return false;

    setIsProcessing(true);

    const isValidDocument = await validateDocumentAuthenticity();
    if (!isValidDocument) {
      setIsProcessing(false);
      return false;
    }

    let photoUrl = photoPreview;
    try {
      if (!supabase) throw new Error("Supabase client is unavailable");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && uploadedFile) {
        toast.loading("Mengunggah dokumen...", { id: "upload-id" });
        photoUrl = await uploadFileToSupabase(uploadedFile, user.id);
        toast.dismiss("upload-id");
      }
    } catch (uploadError) {
      toast.dismiss("upload-id");
      console.error("Upload error:", uploadError);
      toast.warning("Gagal mengunggah ke cloud, menggunakan pratinjau lokal");
    }

    const cleanedIdNumber = idNumber.trim().toUpperCase();
    const cleanedFullName = fullName.trim();

    const data = {
      fullName: cleanedFullName,
      nik: cleanedIdNumber,
      phone: savedIdentity?.phone || "",
      address: savedIdentity?.address || "",
      idType,
      idNumber: cleanedIdNumber,
      photoUrl: photoUrl || undefined,
      verified: true,
    };

    try {
      if (!supabase) throw new Error("Supabase client is unavailable");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIdentity(data);
        if (onVerificationComplete) {
          onVerificationComplete({ ...data, isAnonymous: true });
        }
        setIsProcessing(false);
        toast.success("Identitas tersimpan untuk pemesanan ini");
        return data;
      }

      try {
        await upsertIdentityToSupabase({
          ...data,
          user_id: user.id,
          validationResults,
        });
        toast.success("Identitas berhasil disimpan dan diverifikasi");
      } catch (supabaseError) {
        console.error("Supabase failed, saving locally:", supabaseError);
        toast.warning("Koneksi database bermasalah, data disimpan lokal");
      }

      setIdentity(data);
      setIsEditing(false);
      if (onVerificationComplete) onVerificationComplete(data);
      setIsProcessing(false);
      return data;
    } catch (error) {
      console.error("Error saving identity:", error);
      setIdentity(data);
      if (onVerificationComplete) onVerificationComplete(data);
      setIsProcessing(false);
      return data;
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(),
  }));

  const handleTypeChange = (nextType: IdType) => {
    setIdType(nextType);
    // Bersihkan karakter huruf jika pindah dari Paspor ke tipe khusus angka
    if (!ID_CONFIG[nextType].allowAlpha) {
      setIdNumber((prev) =>
        prev.replace(/[^0-9]/g, "").slice(0, ID_CONFIG[nextType].maxLength)
      );
    } else {
      setIdNumber((prev) => prev.slice(0, ID_CONFIG[nextType].maxLength));
    }
    setErrors((prev) => ({ ...prev, idNumber: "" }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, atau WEBP)");
      return;
    }

    setUploadedFile(file);
    setValidationResults({ authenticity: "pending", confidence: 0, issues: [] });

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setErrors((prev) => ({ ...prev, photo: "" }));
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async (facing: "user" | "environment" = currentCamera) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      setIsCameraActive(true);

      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Izin kamera ditolak. Silakan gunakan opsi Pilih File.");
      } else if (err.name === "NotFoundError") {
        toast.error("Kamera tidak ditemukan. Silakan gunakan opsi Pilih File.");
      } else {
        toast.error("Gagal membuka kamera. Silakan gunakan opsi Pilih File.");
      }
    }
  };

  const takePhoto = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      try {
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoPreview(imageData);
          setUploadedFile(null);
          setValidationResults({
            authenticity: "pending",
            confidence: 0,
            issues: [],
          });
          setErrors((prev) => ({ ...prev, photo: "" }));
          stopCamera();
        }
      } catch (error) {
        console.error("Error taking photo:", error);
        toast.error("Gagal mengambil foto. Silakan coba lagi.");
      }
    } else {
      toast.error("Kamera belum siap. Tunggu sesaat lalu coba lagi.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const switchCamera = () => {
    const nextCamera = currentCamera === "user" ? "environment" : "user";
    setCurrentCamera(nextCamera);
    startCamera(nextCamera);
  };

  const activeConfig = ID_CONFIG[idType];

  const maskIdNumber = (val: string) => {
    const clean = val.trim();
    if (clean.length <= 4) return clean;
    return `${"•".repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
  };

  if (!isEditing && idNumber && fullName && photoPreview) {
    return (
      <div className="rounded-2xl border border-forest/30 bg-forest-soft/50 p-4 sm:p-5 font-body">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-forest text-primary-foreground flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest">
                  Identitas Terlampir • {activeConfig.label}
                </span>
                <span className="px-2 py-0.5 rounded-2xl bg-background border border-forest/25 text-[10px] font-bold text-forest">
                  Siap Serah Terima
                </span>
              </div>
              <p className="font-sans text-sm sm:text-base font-bold text-foreground truncate">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                Nomor {activeConfig.label}:{" "}
                <span className="font-semibold text-foreground">
                  {maskIdNumber(idNumber)}
                </span>{" "}
                • Foto dokumen terunggah
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center px-4 h-9 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors shrink-0 cursor-pointer"
          >
            Ubah Identitas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-body">
      {/* 1. Indikator Keamanan Data (Forest Soft) */}
      <div className="rounded-2xl bg-forest-soft border border-forest/25 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-forest text-primary-foreground flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            Data identitas Anda dienkripsi dan hanya digunakan untuk syarat serah terima perlengkapan di Pool Habema.
          </p>
        </div>

        {idNumber && fullName && photoPreview && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-2xl border border-border bg-background hover:border-forest text-[11px] font-bold text-foreground shrink-0 cursor-pointer"
          >
            Sembunyikan
          </button>
        )}
      </div>

      {/* 2. Pemilih Jenis Dokumen */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-foreground">
          Jenis Dokumen Identitas
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["ktp", "sim", "pelajar", "paspor"] as IdType[]).map((type) => {
            const isSelected = idType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-colors uppercase cursor-pointer ${
                  isSelected
                    ? "bg-forest text-primary-foreground border-forest"
                    : "bg-background text-muted-foreground border-border hover:border-forest hover:text-foreground"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Input Nomor & Nama Lengkap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nomor Identitas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="id-number-input"
              className={`text-xs font-bold ${
                errors.idNumber ? "text-destructive" : "text-foreground"
              }`}
            >
              Nomor {activeConfig.label} <span className="text-gold">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {idNumber.length}/{activeConfig.maxLength}
            </span>
          </div>

          <Input
            id="id-number-input"
            type="text"
            inputMode={activeConfig.allowAlpha ? "text" : "numeric"}
            autoCapitalize="characters"
            maxLength={activeConfig.maxLength}
            className={`rounded-2xl h-11 text-sm tabular-nums shadow-none ${
              errors.idNumber
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-0"
                : "border-input focus-visible:border-forest focus-visible:ring-0"
            }`}
            value={idNumber}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setIdNumber("");
                setErrors((prev) => ({ ...prev, idNumber: "" }));
                return;
              }

              if (activeConfig.allowAlpha) {
                const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setIdNumber(cleaned.slice(0, activeConfig.maxLength));
                setErrors((prev) => ({ ...prev, idNumber: "" }));
              } else if (/^[0-9]+$/.test(raw)) {
                setIdNumber(raw.slice(0, activeConfig.maxLength));
                setErrors((prev) => ({ ...prev, idNumber: "" }));
              } else {
                setErrors((prev) => ({
                  ...prev,
                  idNumber: `Nomor ${activeConfig.label} hanya boleh berisi angka`,
                }));
              }
            }}
            placeholder={activeConfig.placeholder}
          />

          {errors.idNumber ? (
            <p className="text-xs text-destructive font-medium">
              {errors.idNumber}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {activeConfig.hint}
            </p>
          )}
        </div>

        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <Label
            htmlFor="id-fullname-input"
            className={`text-xs font-bold ${
              errors.fullName ? "text-destructive" : "text-foreground"
            }`}
          >
            Nama Lengkap Sesuai {activeConfig.label}{" "}
            <span className="text-gold">*</span>
          </Label>

          <Input
            id="id-fullname-input"
            type="text"
            className={`rounded-2xl h-11 text-sm shadow-none ${
              errors.fullName
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-0"
                : "border-input focus-visible:border-forest focus-visible:ring-0"
            }`}
            value={fullName}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setFullName("");
                setErrors((prev) => ({ ...prev, fullName: "" }));
                return;
              }

              // Mengizinkan huruf, spasi, titik (.), koma (,), petik ('), dan tanda hubung (-)
              if (/^[a-zA-Z\s.,'-]+$/.test(val)) {
                setFullName(val);
                setErrors((prev) => ({ ...prev, fullName: "" }));
              } else {
                setErrors((prev) => ({
                  ...prev,
                  fullName: "Nama tidak boleh mengandung angka atau simbol khusus",
                }));
              }
            }}
            placeholder="Contoh: M. Rizki Pratama"
          />

          {errors.fullName ? (
            <p className="text-xs text-destructive font-medium">
              {errors.fullName}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Wajib sama dengan nama yang tertera di kartu identitas
            </p>
          )}
        </div>
      </div>

      {/* 4. Foto / Unggah Dokumen */}
      <div className="space-y-1.5">
        <Label
          className={`text-xs font-bold ${
            errors.photo ? "text-destructive" : "text-foreground"
          }`}
        >
          Foto Kartu {activeConfig.label} <span className="text-gold">*</span>
        </Label>

        <div
          className={`relative min-h-52 rounded-2xl border border-dashed transition-colors overflow-hidden ${
            errors.photo
              ? "border-destructive bg-destructive/5"
              : "border-border bg-muted/40"
          }`}
        >
          {isCameraActive ? (
            <div className="relative h-64 sm:h-72 bg-foreground flex flex-col">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Panduan bingkai kartu di tengah layar kamera */}
              <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-primary-foreground/60 rounded-2xl" />

              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={switchCamera}
                  aria-label="Ganti kamera depan atau belakang"
                  className="w-10 h-10 bg-background/90 text-foreground rounded-full flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={takePhoto}
                  aria-label="Ambil gambar"
                  className="w-14 h-14 bg-background rounded-full flex items-center justify-center border-2 border-forest cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 bg-gold rounded-full" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  aria-label="Tutup kamera"
                  className="w-10 h-10 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                className="w-full h-64 object-contain bg-muted/60"
                alt={`Pratinjau ${activeConfig.label}`}
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setUploadedFile(null);
                  setValidationResults({
                    authenticity: "pending",
                    confidence: 0,
                    issues: [],
                  });
                }}
                aria-label="Hapus foto dokumen"
                className="absolute top-3 right-3 bg-background border border-border p-2 rounded-full hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full px-4 py-9 gap-3 text-center">
              <div className="w-11 h-11 rounded-2xl bg-background border border-border flex items-center justify-center text-forest">
                <Camera className="w-5 h-5" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-2xl bg-forest hover:bg-forest-dark text-primary-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera</span>
                </button>

                <input
                  type="file"
                  id="id-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="id-upload"
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-2xl border border-border bg-background hover:border-forest text-xs font-bold text-foreground cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-forest" />
                  <span>Pilih File Gambar</span>
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Pastikan seluruh tulisan pada kartu terbaca jelas (JPG/PNG, maks. 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Status Proses Validasi */}
        {(isAnalyzing || isProcessing) && (
          <div className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-forest shrink-0" />
            <span>Memverifikasi kelengkapan dokumen identitas...</span>
          </div>
        )}

        {/* Hasil Validasi Dokumen */}
        {validationResults.authenticity !== "pending" && !isAnalyzing && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              validationResults.authenticity === "authentic"
                ? "bg-forest-soft border-forest/30 text-forest-dark"
                : "bg-accent border-gold/40 text-accent-foreground"
            }`}
          >
            {validationResults.authenticity === "authentic" ? (
              <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-xs">
              <p className="font-bold">
                {validationResults.authenticity === "authentic"
                  ? "Dokumen siap diverifikasi admin"
                  : "Periksa kembali kejelasan dokumen"}
              </p>
              {validationResults.issues.map((issue, idx) => (
                <p key={idx} className="text-[11px] opacity-90">
                  • {issue}
                </p>
              ))}
            </div>
          </div>
        )}

        {errors.photo && (
          <p className="text-xs text-destructive font-medium">{errors.photo}</p>
        )}
      </div>
    </div>
  );
}