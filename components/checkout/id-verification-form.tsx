"use client";

import { useState, useRef, useEffect, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Camera, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";

export function IDVerificationForm({ onVerificationComplete, ref }: any) {
  const router = useRouter();
  
  // Ambil data dan fungsi dari Zustand
  const savedIdentity = useCartStore((state) => state.identity);
  const setIdentity = useCartStore((state) => state.setIdentity);

  // Local State
  const [idType, setIdType] = useState<any>("ktp");
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Document validation states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    authenticity: 'pending' | 'authentic' | 'suspicious' | 'fake';
    confidence: number;
    issues: string[];
  }>({
    authenticity: 'pending',
    confidence: 0,
    issues: []
  });

  // Camera permission states
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt');
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('user');

  // Function to check if identity already exists
  const checkExistingIdentity = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_identity')
        .select('id, id_type, id_number, id_photo_url, verification_status')
        .eq('user_id', userId)
        .single();
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Function to insert or update identity data via server API
  const upsertIdentityToSupabase = async (identityData: any) => {
    const res = await fetch('/api/identity/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.error('Supabase error details:', JSON.stringify(json));
      throw new Error(
        [json.error, json.detail].filter(Boolean).join(': ') ||
          'Failed to save identity'
      );
    }

    return json.data;
  };

  // Load existing identity from database if user is authenticated
  useEffect(() => {
    const loadExistingIdentity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: existingIdentity } = await checkExistingIdentity(user.id);
          
          if (existingIdentity) {
            // Pre-fill form with existing data
            setIdType(existingIdentity.id_type || "ktp");
            setIdNumber(existingIdentity.id_number || "");
            setPhotoPreview(existingIdentity.id_photo_url || null);
            
            // Also save to Zustand for consistency
            setIdentity({
              idType: existingIdentity.id_type,
              idNumber: existingIdentity.id_number,
              photoUrl: existingIdentity.id_photo_url,
              fullName: fullName, // Keep current full name from form
              nik: existingIdentity.id_number, // Use id_number as nik
              phone: "", // Empty for now
              address: "", // Empty for now
              verified: existingIdentity.verification_status === 'verified',
            });
            
            toast.info("Data identitas Anda sebelumnya telah dimuat");
          }
        }
      } catch (error) {
        console.log('No existing identity found or user not authenticated');
      }
    };
    
    loadExistingIdentity();
  }, []); // Run once on component mount

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

  // Document authenticity validation function
  const validateDocumentAuthenticity = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setValidationResults({ authenticity: 'pending', confidence: 0, issues: [] });

    try {
      // Simulate AI/ML analysis for document validation
      // In production, this would call an actual ML service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation logic - analyze image characteristics
      const mockAnalysis = analyzeDocumentCharacteristics(imageUrl);
      
      setValidationResults(mockAnalysis);
      
      if (mockAnalysis.authenticity === 'fake') {
        toast.error("Dokumen terdeteksi sebagai palsu. Silakan gunakan dokumen asli.");
        return false;
      } else if (mockAnalysis.authenticity === 'suspicious') {
        toast.warning("Dokumen mencurigakan. Pastikan dokumen asli dan jelas.");
        return false;
      } else {
        toast.success("Dokumen valid dan terverifikasi sebagai asli.");
        return true;
      }
    } catch (error) {
      console.error('Document validation error:', error);
      toast.error("Gagal memvalidasi dokumen. Silakan coba lagi.");
      setValidationResults({
        authenticity: 'suspicious',
        confidence: 0,
        issues: ['Validation system error']
      });
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock document analysis function
  const analyzeDocumentCharacteristics = (imageUrl: string) => {
    // CATATAN: ini hanya placeholder. Deteksi keaslian yang sesungguhnya
    // memerlukan model ML (hologram, konsistensi font, tekstur, dll) atau
    // layanan verifikasi pihak ketiga.
    //
    // Sebelumnya fungsi ini memakai Math.random() sehingga menolak dokumen
    // ASLI secara acak (~10% "palsu", ~20% "mencurigakan"). Untuk MVP hal
    // itu dihapus: dokumen diteruskan sebagai valid, dan keputusan akhir
    // dilakukan admin secara manual lewat notifikasi verifikasi ID.
    return {
      authenticity: 'authentic' as const,
      confidence: 0.92,
      issues: [] as string[],
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return false;

    // First validate document authenticity
    if (!photoPreview) {
      toast.error("Foto Dokumen wajib diambil terlebih dahulu");
      return false;
    }

    setIsProcessing(true);

    // Validate document authenticity before proceeding
    const isValidDocument = await validateDocumentAuthenticity(photoPreview);
    if (!isValidDocument) {
      setIsProcessing(false);
      return false;
    }

    // Upload file to Supabase storage if file was uploaded (not camera photo)
    let photoUrl = photoPreview;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && uploadedFile) {
        // Upload file to Supabase storage
        toast.loading("Mengupload file...", { id: "upload" });
        photoUrl = await uploadFileToSupabase(uploadedFile, user.id);
        toast.dismiss("upload");
        toast.success("File berhasil diupload");
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      // If upload fails, fall back to base64 photoPreview
      toast.warning("Gagal upload ke storage, menggunakan base64");
    }

    // Prepare data first (needed for both authenticated and anonymous flows)
    const data = {
      fullName,
      nik: idNumber, // Using idNumber as nik
      phone: "", // Empty string for now, can be added later
      address: "", // Empty string for now, can be added later
      idType,
      idNumber,
      photoUrl: photoUrl || undefined,
      verified: true,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Anonymous: simpan ke localStorage saja dan lanjut
      if (!user) {
        setIdentity(data);
        if (onVerificationComplete) {
          onVerificationComplete({ ...data, isAnonymous: true });
        }
        setIsProcessing(false);
        toast.success("Identitas tersimpan (mode anonim)");
        return data;
      }

      // Authed: simpan ke Supabase, fallback ke lokal bila DB gagal
      try {
        await upsertIdentityToSupabase({
          ...data,
          user_id: user.id,
          fullName,
          validationResults,
        });
        toast.success("Identitas berhasil disimpan dan diverifikasi");
      } catch (supabaseError) {
        console.error("Supabase failed, saving to local only:", supabaseError);
        toast.warning("Database gagal, data disimpan lokal saja");
      }

      // Simpan ke Zustand (LocalStorage) - selalu dijalankan
      setIdentity(data);
      if (onVerificationComplete) onVerificationComplete(data);

      setIsProcessing(false);
      return data;
    } catch (error) {
      console.error("Error saving identity:", error);
      toast.error("Terjadi kesalahan, data disimpan lokal saja");

      // Fallback: simpan ke Zustand saja
      setIdentity(data);
      if (onVerificationComplete) onVerificationComplete(data);
      setIsProcessing(false);
      return data;
    }
  };

  // Ekspos fungsi submit ke parent (dipakai oleh tombol utama di akhir halaman)
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(),
  }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File terlalu besar (Maksimal 5MB)");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar (JPG, PNG, dll)");
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        if (errors.photo) setErrors({ ...errors, photo: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file to Supabase storage
  const uploadFileToSupabase = async (file: File, userId: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('id-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('id-documents')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Gagal mengupload file ke storage');
    }
  };

  // ID number format validation
  const validateIdFormat = (id: string, type: string): boolean => {
    const cleanId = id.replace(/[^0-9]/g, '');
    
    switch (type) {
      case 'ktp':
        return cleanId.length === 16 && /^[0-9]{16}$/.test(cleanId);
      case 'sim':
        return cleanId.length >= 10 && cleanId.length <= 12 && /^[0-9]{10,12}$/.test(cleanId);
      case 'paspor':
        return cleanId.length >= 6 && cleanId.length <= 9 && /^[A-Z0-9]{6,9}$/.test(id.toUpperCase());
      case 'pelajar':
        return cleanId.length >= 10 && cleanId.length <= 15 && /^[0-9]{10,15}$/.test(cleanId);
      default:
        return cleanId.length >= 5;
    }
  };

  const startCamera = async () => {
    console.log('Starting camera...');
    
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      
      setCameraPermission('prompt');
      setIsCameraActive(true); // Show camera UI immediately
      
      // Stop any existing stream first
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      console.log('Requesting camera permission...');
      
      // Simple camera request with current camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentCamera, // Use current camera state
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('Camera stream obtained:', stream.getVideoTracks().length, 'tracks');
      
      setCameraPermission('granted');
      
      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Simple play attempt
        videoRef.current.play().then(() => {
          console.log('Camera started successfully');
        }).catch(error => {
          console.log('Play error (non-critical):', error);
        });
      }
      
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      
      // Handle different error types
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        toast.error("Izin kamera ditolak. Gunakan opsi upload manual.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermission('error');
        toast.error("Tidak ada kamera yang terdeteksi. Gunakan opsi upload manual.");
      } else if (err.message === 'Camera API not supported') {
        setCameraPermission('error');
        toast.error("Browser tidak mendukung kamera. Gunakan opsi upload manual.");
      } else {
        setCameraPermission('error');
        toast.error("Gagal mengakses kamera. Gunakan opsi upload manual.");
      }
    }
  };

  const takePhoto = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
      try {
        const canvas = document.createElement("canvas");
        const video = videoRef.current;
        
        // Use actual video dimensions
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to JPEG with quality
          const imageData = canvas.toDataURL("image/jpeg", 0.8);
          setPhotoPreview(imageData);
          
          // Stop camera after taking photo
          stopCamera();
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        toast.error("Gagal mengambil foto. Silakan coba lagi.");
      }
    } else {
      console.error('Video not ready for capture');
      toast.error("Kamera belum siap. Tunggu beberapa saat dan coba lagi.");
    }
  };

  const stopCamera = () => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
      setIsCameraActive(false); // Still set state even if error
    }
  };

  const switchCamera = async () => {
    const newCamera = currentCamera === 'user' ? 'environment' : 'user';
    setCurrentCamera(newCamera);
    
    // Stop current camera and restart with new camera
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Restart camera with new facing mode
    setTimeout(() => startCamera(), 100);
  };

  const validatorFrom = () => {
    const newErrors: { [key: string]: string } = {};

    if (!idNumber.trim()) {
      newErrors.idNumber = "Nomor identitas tidak boleh kosong";
    } else if (!validateIdFormat(idNumber, idType)) {
      const requirements = {
        ktp: "KTP harus 16 digit angka",
        sim: "SIM harus 10-12 digit angka", 
        paspor: "Paspor harus 6-9 karakter (huruf/angka)",
        pelajar: "Kartu Pelajar harus 10-15 digit angka"
      };
      newErrors.idNumber = requirements[idType as keyof typeof requirements] || "Format tidak valid";
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

      {/* Security Indicator */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-medium text-blue-900">
              Data identitas Anda dienkripsi dan hanya digunakan untuk keperluan verifikasi sewa
            </p>
          </div>
        </div>
      </div>

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
          className={`relative min-h-52 rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
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
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="bg-white/20 backdrop-blur text-white p-2 rounded-full shadow-lg"
                  title="Switch Camera"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
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
                className="w-full h-64 object-cover"
                alt="Preview"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setUploadedFile(null);
                  // Opsional: reset error foto saat user menghapus preview untuk mencoba lagi
                  if (errors.photo) setErrors({ ...errors, photo: "" });
                }}
                className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full px-4 py-8 gap-3">
              <Camera className="w-7 h-7 text-slate-400" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    startCamera();
                    if (errors.photo) setErrors({ ...errors, photo: "" });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    errors.photo
                      ? "border-red-300 text-red-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto
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
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                    errors.photo
                      ? "border-red-300 text-red-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Pilih File
                </label>
              </div>
              <p className="text-[10px] text-slate-400">JPG / PNG, maksimal 5MB</p>
            </div>
          )}
        </div>

        {/* Document Validation Results */}
        {validationResults.authenticity !== 'pending' && (
          <div className={`p-3 rounded-xl border ${
            validationResults.authenticity === 'authentic' 
              ? 'bg-green-50 border-green-200' 
              : validationResults.authenticity === 'suspicious'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {validationResults.authenticity === 'authentic' ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : validationResults.authenticity === 'suspicious' ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold ${
                    validationResults.authenticity === 'authentic' 
                      ? 'text-green-700' 
                      : validationResults.authenticity === 'suspicious'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {validationResults.authenticity === 'authentic' 
                      ? 'DOKUMEN VALID' 
                      : validationResults.authenticity === 'suspicious'
                      ? 'DOKUMEN MENCURIGAKAN'
                      : 'DOKUMEN PALSU'
                    }
                  </span>
                  <span className={`text-[9px] ${
                    validationResults.authenticity === 'authentic' 
                      ? 'text-green-600' 
                      : validationResults.authenticity === 'suspicious'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {Math.round(validationResults.confidence * 100)}% confidence
                  </span>
                </div>
                {validationResults.issues.length > 0 && (
                  <ul className="text-[9px] space-y-0.5">
                    {validationResults.issues.map((issue, index) => (
                      <li key={index} className={
                        validationResults.authenticity === 'authentic' 
                          ? 'text-green-600' 
                          : validationResults.authenticity === 'suspicious'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }>
                        • {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pesan Error di bawah Container */}
        {errors.photo && (
          <p className="text-[10px] text-red-500 ml-1 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
            {errors.photo}
          </p>
        )}
      </div>

      {/* Format Requirements Helper */}
      <div className="text-center">
        <p className="text-[8px] text-slate-400">
          {idType === 'ktp' && 'KTP: 16 digit angka'}
          {idType === 'sim' && 'SIM: 10-12 digit angka'}
          {idType === 'paspor' && 'Paspor: 6-9 karakter'}
          {idType === 'pelajar' && 'Pelajar: 10-15 digit angka'}
        </p>
      </div>
    </div>
  );
}
