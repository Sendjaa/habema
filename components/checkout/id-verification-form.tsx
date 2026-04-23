"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";

export function IDVerificationForm({ onVerificationComplete }: any) {
  const router = useRouter();
  
  // Ambil data dan fungsi dari Zustand
  const savedIdentity = useCartStore((state) => state.identity);
  const setIdentity = useCartStore((state) => state.setIdentity);

  // Local State
  const [idType, setIdType] = useState<any>("ktp");
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Function to insert identity data to Supabase
  const insertIdentityToSupabase = async (identityData: any) => {
    try {
      console.log('Inserting identity data:', identityData);
      
      const { data, error } = await supabase
        .from('user_identity')
        .insert({
          user_id: identityData.user_id,
          id_type: identityData.idType,
          id_number: identityData.idNumber,
          id_photo_url: identityData.photoUrl,
          verification_status: 'pending'
        });
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error inserting identity details:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  // Sync state dengan Zustand (PENTING untuk menangani re-render dan hydration)
  useEffect(() => {
    if (savedIdentity) {
      setIdType(savedIdentity.idType || "ktp");
      setIdNumber(savedIdentity.idNumber || "");
      setFullName(savedIdentity.fullName || "");
      setPhotoPreview(savedIdentity.photoUrl || null);
    }
  }, [savedIdentity]);

  const validateForm = () => {
    if (!idNumber.trim()) {
      toast.error("Nomor Identitas wajib diisi");
      return false;
    }
    if (!fullName.trim()) {
      toast.error("Nama Lengkap wajib diisi");
      return false;
    }
    if (!photoPreview) {
      toast.error("Foto Dokumen wajib diunggah");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    // Prepare data first (needed for both authenticated and anonymous flows)
    const data = {
      fullName,
      nik: idNumber, // Using idNumber as nik
      phone: "", // Empty string for now, can be added later
      address: "", // Empty string for now, can be added later
      idType,
      idNumber,
      photoUrl: photoPreview || undefined,
      verified: true,
    };
    
    try {
      // Check if user is authenticated first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('User not authenticated - proceeding with anonymous checkout');
        // For anonymous users, save to local storage only and continue
        setIdentity(data);
        
        if (onVerificationComplete) {
          onVerificationComplete({
            ...data,
            isAnonymous: true
          });
        }
        
        setIsProcessing(false);
        toast.success("Identitas tersimpan (mode anonim)");
        return;
      }
    } catch (error) {
      console.log('Auth check failed - proceeding as anonymous');
      // For anonymous users, save to local storage only and continue
      setIdentity(data);
      
      if (onVerificationComplete) {
        onVerificationComplete({
          ...data,
          isAnonymous: true
        });
      }
      
      setIsProcessing(false);
      toast.success("Identitas tersimpan (mode anonim)");
      return;
    }
    // Now we know user is authenticated, proceed with database submission

    // Simulasi delay proses
    setTimeout(async () => {
      try {
        // Get current user again (we already checked above, but need fresh data)
        console.log('Getting current user for submission...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log('Auth response:', { user, authError });
        
        if (authError || !user) {
          console.error('Auth error during submission:', authError);
          toast.error('Terjadi kesalahan autentikasi');
          setIsProcessing(false);
          return;
        }

        // Insert to Supabase
        try {
          await insertIdentityToSupabase({
            ...data,
            user_id: user.id
          });
          toast.success("Identitas berhasil disimpan ke database");
        } catch (supabaseError) {
          console.error('Supabase failed, saving to local only:', supabaseError);
          toast.warning("Database gagal, data disimpan lokal saja");
        }

        // Simpan ke Zustand (LocalStorage) - selalu dijalankan
        setIdentity(data);

        if (onVerificationComplete) onVerificationComplete(data);

        setIsProcessing(false);
      } catch (error) {
        console.error('Error saving identity:', error);
        toast.error("Terjadi kesalahan, data disimpan lokal saja");
        
        // Fallback: simpan ke Zustand saja
        setIdentity(data);
        if (onVerificationComplete) onVerificationComplete(data);
        setIsProcessing(false);
      }
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File terlalu besar (Maksimal 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Izin kamera ditolak");
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      setPhotoPreview(canvas.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setIsCameraActive(false);
  };

  const validatorFrom = () => {
    const newErrors: { [key: string]: string } = {};

    if (!idNumber.trim()) {
      newErrors.idNumber = "Nomor identitas tidak boleh kosong";
    } else if (idNumber.length < 5) {
      newErrors.idNumber = "Nomor identitas terlalu pendek";
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    }

    if (!photoPreview) {
      newErrors.photo = "Anda harus mengunggah atau mengambil foto dokumen";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Mohon lengkapi formulir dengan benar");
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Tipe Identitas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {["ktp", "sim", "pelajar", "paspor"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setIdType(type as any)}
            className={`py-3 rounded-xl border text-[10px] font-bold transition-all uppercase ${
              idType === type
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Nomor Identitas */}
        <div className="space-y-1.5">
          <Label
            className={`text-[11px] font-bold uppercase ml-1 transition-colors ${
              errors.idNumber ? "text-red-500" : "text-slate-500"
            }`}
          >
            Nomor Identitas ({idType})
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            className={`rounded-xl h-11 transition-all ${
              errors.idNumber
                ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                : "border-slate-200 focus-visible:ring-slate-900"
            }`}
            value={idNumber}
            onChange={(e) => {
              const val = e.target.value;

              // 1. Tentukan limit berdasarkan tipe ID
              let maxLength = 16;
              if (idType === "ktp") maxLength = 16;
              else if (idType === "sim") maxLength = 12;
              else if (idType === "paspor") maxLength = 9;
              else if (idType === "pelajar") maxLength = 15;

              // 2. Logic Hapus (String Kosong)
              if (val === "") {
                setIdNumber("");
                setErrors({ ...errors, idNumber: "" });
                return;
              }

              // 3. Validasi Angka dan Panjang Karakter
              if (/^[0-9]+$/.test(val)) {
                if (val.length <= maxLength) {
                  setIdNumber(val);
                  setErrors({ ...errors, idNumber: "" });
                } else {
                  setErrors({
                    ...errors,
                    idNumber: `Maksimal ${maxLength} digit untuk ${idType.toUpperCase()}`,
                  });
                }
              } else {
                setErrors({
                  ...errors,
                  idNumber: "Hanya boleh berisi angka",
                });
              }
            }}
            placeholder={`Masukkan ${idType.toUpperCase()}`}
          />
          {errors.idNumber && (
            <p className="text-[10px] text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
              ⚠️ {errors.idNumber}
            </p>
          )}
        </div>

        {/* Field Nama Lengkap */}
        <div className="space-y-1.5">
          <Label
            className={`text-[11px] font-bold uppercase ml-1 transition-colors ${
              errors.fullName ? "text-red-500" : "text-slate-500"
            }`}
          >
            Nama Lengkap
          </Label>
          <Input
            className={`rounded-xl h-11 transition-all ${
              errors.fullName
                ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                : "border-slate-200 focus-visible:ring-slate-900"
            }`}
            value={fullName}
            onChange={(e) => {
              const val = e.target.value;

              // PERBAIKAN: Cek jika kosong dulu agar bisa dihapus total
              if (val === "") {
                setFullName("");
                setErrors({ ...errors, fullName: "" });
                return;
              }

              // Validasi hanya huruf dan spasi
              if (/^[a-zA-Z\s]+$/.test(val)) {
                setFullName(val);
                setErrors({ ...errors, fullName: "" });
              } else {
                setErrors({
                  ...errors,
                  fullName: "Nama hanya boleh berisi huruf",
                });
              }
            }}
            placeholder="Masukkan nama sesuai ID"
          />
          {errors.fullName && (
            <p className="text-[10px] text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
              ⚠️ {errors.fullName}
            </p>
          )}
        </div>
      </div>

      {/* Kontainer Foto */}
      <div className="space-y-1.5">
        <Label
          className={`text-[11px] font-bold uppercase ml-1 transition-colors ${
            errors.photo ? "text-red-500" : "text-slate-500"
          }`}
        >
          Foto Dokumen
        </Label>

        <div
          className={`relative h-64 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center overflow-hidden ${
            errors.photo
              ? "border-red-500 bg-red-50/30"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          {isCameraActive ? (
            <div className="absolute inset-0 bg-black flex flex-col">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90"
                >
                  <div className="w-10 h-10 border-2 border-slate-900 rounded-full" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-500 text-white p-2 rounded-full shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : photoPreview ? (
            <>
              <img
                src={photoPreview}
                className="w-full h-full object-cover"
                alt="Preview"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  // Opsional: reset error foto saat user menghapus preview untuk mencoba lagi
                  if (errors.photo) setErrors({ ...errors, photo: "" });
                }}
                className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </>
          ) : (
            <div className="flex gap-8">
              <div className="relative text-center group">
                <div
                  className={`w-16 h-16 rounded-2xl bg-white border flex items-center justify-center shadow-sm cursor-pointer transition-all ${
                    errors.photo
                      ? "border-red-300"
                      : "border-slate-200 group-hover:border-slate-400"
                  }`}
                >
                  <Upload
                    className={`w-6 h-6 transition-colors ${
                      errors.photo
                        ? "text-red-400"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e);
                      if (errors.photo) setErrors({ ...errors, photo: "" });
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold mt-2 block ${errors.photo ? "text-red-500" : "text-slate-500"}`}
                >
                  FILE
                </span>
              </div>

              <div className="text-center group">
                <button
                  type="button"
                  onClick={() => {
                    startCamera();
                    if (errors.photo) setErrors({ ...errors, photo: "" });
                  }}
                  className={`w-16 h-16 rounded-2xl bg-white border flex items-center justify-center shadow-sm transition-all ${
                    errors.photo
                      ? "border-red-300"
                      : "border-slate-200 group-hover:border-slate-400"
                  }`}
                >
                  <Camera
                    className={`w-6 h-6 transition-colors ${
                      errors.photo
                        ? "text-red-400"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                </button>
                <span
                  className={`text-[10px] font-bold mt-2 block ${errors.photo ? "text-red-500" : "text-slate-500"}`}
                >
                  KAMERA
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pesan Error di bawah Container */}
        {errors.photo && (
          <p className="text-[10px] text-red-500 ml-1 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
            {errors.photo}
          </p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
      >
        {isProcessing ? "Menyimpan..." : "Simpan Identitas"}
      </Button>
    </div>
  );
}
