"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  CheckCircle2,
  Check,
  Copy,
  Clock,
} from "lucide-react";

export interface ConditionChecklistData {
  itemsChecked: {
    [key: string]: boolean;
  };
  damageNotes: string;
  agreedToTerms: boolean;
  policySnapshot?: {
    brandName: string;
    policyTitle: string;
    overtimeFee: string;
    clauses: string[];
  };
}

export interface TermsClause {
  id: string;
  text: string;
  mandatory: boolean;
}

export interface TermsPolicyConfig {
  brandName: string;
  policyTitle: string;
  policyVersion: string;
  overtimeRule: string;
  depositNote: string;
  clauses: TermsClause[];
}

interface RentalConditionsChecklistProps {
  equipmentName: string;
  onChecklistComplete: (data: ConditionChecklistData) => void;
  editable?: boolean;
  initialPolicy?: Partial<TermsPolicyConfig>;
}

const DEFAULT_POLICY: TermsPolicyConfig = {
  brandName: "Habema Outdoor",
  policyTitle: "Syarat & Ketentuan Serah-Terima Gear",
  policyVersion: "v2.4 • Standar Operasional",
  overtimeRule: "Denda 100% tarif harian per 24 jam keterlambatan",
  depositNote: "Jaminan KTP/SIM asli ditahan selama masa sewa",
  clauses: [
    {
      id: "cl-1",
      text: "Peralatan wajib dikembalikan dalam kondisi lengkap, kering, dan bersih sesuai standar inspeksi awal.",
      mandatory: true,
    },
    {
      id: "cl-2",
      text: "Kerusakan fisik (robek bara api, patah frame akibat kelalaian) atau kehilangan komponen ditanggung penyewa sesuai harga penggantian.",
      mandatory: true,
    },
    {
      id: "cl-3",
      text: "Keterlambatan pengembalian melewati batas waktu toleransi 2 jam dikenakan biaya overtime sesuai tarif harian.",
      mandatory: true,
    },
  ],
};

export function RentalConditionsChecklist({
  equipmentName,
  onChecklistComplete,
  editable = true,
  initialPolicy,
}: RentalConditionsChecklistProps) {
  const policy: TermsPolicyConfig = {
    ...DEFAULT_POLICY,
    ...initialPolicy,
    clauses: initialPolicy?.clauses ?? DEFAULT_POLICY.clauses,
  };

  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Salin teks dokumen S&K siap tempel
  const handleCopyPolicyText = async () => {
    const formatted = [
      `${policy.policyTitle.toUpperCase()} — ${policy.brandName}`,
      `Versi: ${policy.policyVersion}`,
      `Unit: ${equipmentName}`,
      ``,
      ...policy.clauses.map((c, idx) => `${idx + 1}. ${c.text}`),
      ``,
      `Ketentuan Keterlambatan: ${policy.overtimeRule}`,
      `Jaminan Identitas: ${policy.depositNote}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(formatted);
    } catch {
      // Fallback bila clipboard dibatasi
    }
    setCopiedPolicy(true);
    setTimeout(() => setCopiedPolicy(false), 2000);
  };

  // Otomatis kirim data saat pengguna menyetujui syarat serah-terima
  useEffect(() => {
    if (!agreedToTerms || !editable) return;
    onChecklistComplete({
      itemsChecked: {
        terms_acknowledged: true,
      },
      damageNotes: "",
      agreedToTerms,
      policySnapshot: {
        brandName: policy.brandName,
        policyTitle: policy.policyTitle,
        overtimeFee: policy.overtimeRule,
        clauses: policy.clauses.map((c) => c.text),
      },
    });
    setIsSubmitted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreedToTerms, editable]);

  if (isSubmitted && !editable) {
    return (
      <div className="rounded-2xl border border-forest/30 bg-forest-soft p-5 sm:p-6 font-body">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-forest text-primary-foreground flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-sm sm:text-base font-bold text-foreground">
              Syarat &amp; Ketentuan Sewa Disetujui
            </h3>
            <p className="text-xs sm:text-sm text-forest-dark leading-relaxed">
              Ketentuan penyewaan <strong className="font-semibold">{equipmentName}</strong> dan{" "}
              <strong className="font-semibold">{policy.policyTitle}</strong> ({policy.brandName}) telah disetujui.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden font-body">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest mb-0.5">
            Ketentuan Penyewaan • {policy.brandName}
          </span>
          <h3 className="font-sans text-base sm:text-lg font-bold text-foreground truncate">
            {policy.policyTitle} — {equipmentName}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyPolicyText}
            title="Salin teks Syarat & Ketentuan"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl border border-border bg-background hover:border-forest text-[11px] font-bold text-foreground transition-colors cursor-pointer"
          >
            {copiedPolicy ? (
              <>
                <Check className="w-3 h-3 text-forest" />
                <span className="text-forest">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-muted-foreground" />
                <span>Salin S&amp;K</span>
              </>
            )}
          </button>

          <span
            className={`px-3 py-1 rounded-2xl text-xs font-bold ${
              agreedToTerms
                ? "bg-forest-soft text-forest border border-forest/30"
                : "bg-accent text-accent-foreground border border-gold/35"
            }`}
          >
            {agreedToTerms ? "Disetujui" : "Perlu Persetujuan"}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4 bg-background">
        {/* Ringkasan Parameter Kebijakan Aktif (Overtime & Jaminan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl border border-border bg-muted/35 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ketentuan Keterlambatan
              </span>
              <span className="font-semibold text-foreground">
                {policy.overtimeRule}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-border bg-muted/35 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Jaminan Serah-Terima
              </span>
              <span className="font-semibold text-foreground">
                {policy.depositNote}
              </span>
            </div>
          </div>
        </div>

        {/* Kotak Centang Persetujuan Syarat & Ketentuan (Langsung Aktif) */}
        {editable ? (
          <label
            htmlFor="terms"
            className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
              agreedToTerms
                ? "bg-forest-soft/60 border-forest"
                : "bg-accent/55 border-gold/40 hover:border-gold"
            }`}
          >
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked === true)
              }
              className="mt-0.5 bg-background border-input data-[state=checked]:bg-forest data-[state=checked]:border-forest"
            />
            <div className="text-xs text-foreground space-y-2 leading-relaxed">
              <p className="font-bold text-foreground">
                Saya telah membaca dan menyetujui {policy.policyTitle} ({policy.brandName}):
              </p>
              <ul className="space-y-1.5 text-foreground/85">
                {policy.clauses.map((clause) => (
                  <li key={clause.id} className="flex items-start gap-2">
                    <span className="text-gold font-bold">•</span>
                    <span>{clause.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </label>
        ) : (
          <div className="p-4 rounded-2xl border border-border bg-muted/30 text-xs text-foreground space-y-2 leading-relaxed">
            <p className="font-bold text-foreground">
              Ketentuan Berlaku ({policy.brandName}):
            </p>
            <ul className="space-y-1.5 text-foreground/85">
              {policy.clauses.map((clause) => (
                <li key={clause.id} className="flex items-start gap-2">
                  <span className="text-gold font-bold">•</span>
                  <span>{clause.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}