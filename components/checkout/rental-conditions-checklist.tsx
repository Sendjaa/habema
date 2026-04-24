"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface ConditionChecklistData {
  itemsChecked: {
    [key: string]: boolean;
  };
  damageNotes: string;
  agreedToTerms: boolean;
}

interface RentalConditionsChecklistProps {
  equipmentName: string;
  onChecklistComplete: (data: ConditionChecklistData) => void;
  editable?: boolean;
}

export function RentalConditionsChecklist({
  equipmentName,
  onChecklistComplete,
  editable = true,
}: RentalConditionsChecklistProps) {
  const defaultChecklist = {
    structure_intact: false,
    no_visible_damage: false,
    all_parts_present: false,
    clean_condition: false,
    functioning_properly: false,
    zippers_working: false,
    seals_intact: false,
    no_odors: false,
  };

  const [checkedItems, setCheckedItems] = useState<{
    [key: string]: boolean;
  }>(defaultChecklist);
  const [damageNotes, setDamageNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const checklistItems = [
    {
      id: "structure_intact",
      label: "Struktur Utama Utuh",
      icon: "🏗️",
      critical: true,
    },
    {
      id: "no_visible_damage",
      label: "Tidak Ada Kerusakan Terlihat",
      icon: "✨",
      critical: true,
    },
    {
      id: "all_parts_present",
      label: "Semua Bagian Lengkap",
      icon: "🔧",
      critical: true,
    },
    {
      id: "clean_condition",
      label: "Dalam Kondisi Bersih",
      icon: "🧹",
      critical: false,
    },
    {
      id: "functioning_properly",
      label: "Berfungsi Dengan Baik",
      icon: "⚙️",
      critical: true,
    },
    {
      id: "zippers_working",
      label: "Resleting/Kunci Lancar",
      icon: "🔐",
      critical: false,
    },
    {
      id: "seals_intact",
      label: "Segel/Lapisan Utuh",
      icon: "🛡️",
      critical: false,
    },
    {
      id: "no_odors",
      label: "Tidak Berbau Tidak Sedap",
      icon: "👃",
      critical: false,
    },
  ];

  const handleCheckItem = (itemId: string) => {
    if (!editable && isSubmitted) return;

    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSubmit = () => {
    if (!agreedToTerms) {
      alert("Anda harus setuju dengan syarat dan ketentuan");
      return;
    }

    onChecklistComplete({
      itemsChecked: checkedItems,
      damageNotes,
      agreedToTerms,
    });

    setIsSubmitted(true);
  };

  if (isSubmitted && !editable) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-900 mb-1">Checklist Selesai</h3>
            <p className="text-sm text-green-800">
              Peralatan telah diperiksa dan disetujui. Silakan lanjutkan ke
              tahap berikutnya.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-white border-border">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-forest mb-1 sm:mb-2">
          Daftar Periksa Kondisi - {equipmentName}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Periksa kondisi peralatan sebelum serah-terima
        </p>
      </div>

      <div className="space-y-6">
        {/* Alert */}
        <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-blue-800">
            Item yang bertanda <span className="font-bold">★</span> adalah
            persyaratan kritis yang harus disetujui
          </p>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2 sm:space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-forest/5 bg-white/50"
            >
              {/* Icon Standar */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-forest/5 text-sm sm:text-lg flex-shrink-0">
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-reguler text-xs sm:text-sm text-black truncate">
                    {item.label}
                  </span>
                  {item.critical && (
                    <span className="text-[9px] sm:text-[10px] bg-red-50 text-red-500 px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-red-100 w-fit">
                      Wajib
                    </span>
                  )}
                </div>
              </div>

              {/* Indikator Status (Opsional, hanya sebagai penanda visual bahwa ini standar Habema) */}
              <div className="text-[9px] sm:text-[10px] font-black text-gold uppercase tracking-widest opacity-50 flex-shrink-0">
                Standard
              </div>
            </div>
          ))}
        </div>

        {/* Terms */}
        {editable && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Checkbox
              className="bg-white"
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
            />
            <label
              htmlFor="terms"
              className="text-xs sm:text-sm text-orange-900 cursor-pointer"
            >
              <p className="font-semibold mb-1">
                Saya setuju dengan syarat dan ketentuan serah-terima:
              </p>
              <ul className="space-y-1 ml-2 text-xs sm:text-sm">
                <li>• Peralatan akan dikembalikan dalam kondisi baik</li>
                <li>• Kerusakan di luar asuransi akan ditanggung sepenuhnya</li>
                <li>• Pengembalian terlambat akan dikenakan biaya overtime</li>
              </ul>
            </label>
          </div>
        )}

        {/* Submit Button */}
        {editable && (
          <Button
            onClick={handleSubmit}
            disabled={!agreedToTerms}
            className="w-full bg-primary text-primary-foreground hover:bg-forest-dark text-sm sm:text-base"
            size="lg"
          >
            {agreedToTerms
              ? "Lanjutkan"
              : "Checklist Terlebih Dahulu"}
          </Button>
        )}
      </div>
    </Card>
  );
}
