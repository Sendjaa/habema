import { NextResponse } from "next/server";
import { convertQRIS, validateQRIS } from "@/lib/qris";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

interface QrisDynamicRequest {
  amount: number;
  fee?: { type: "fixed" | "percentage"; value: number };
  includeImage?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: QrisDynamicRequest = await request.json();

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount wajib diisi dan lebih besar dari 0" },
        { status: 400 }
      );
    }

    const staticPayload = process.env.QRIS_STATIC_PAYLOAD;
    if (!staticPayload) {
      return NextResponse.json(
        {
          error:
            "QRIS_STATIC_PAYLOAD belum dikonfigurasi. Set env var dengan string QRIS statis mentah (dimulai 000201...).",
        },
        { status: 500 }
      );
    }

    const validation = validateQRIS(staticPayload);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "QRIS statis tidak valid",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const dynamicPayload = convertQRIS(staticPayload, {
      amount: body.amount,
      fee: body.fee,
    });

    const response: { payload: string; imageUrl?: string } = {
      payload: dynamicPayload,
    };

    if (body.includeImage) {
      try {
        response.imageUrl = await QRCode.toDataURL(dynamicPayload, {
          width: 400,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
      } catch (imgErr) {
        console.error("[qris/dynamic] QRCode toDataURL gagal:", imgErr);
      }
    }

    return NextResponse.json({
      success: true,
      amount: body.amount,
      fee: body.fee ?? null,
      ...response,
    });
  } catch (error: any) {
    console.error("[qris/dynamic] error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal generate QRIS dinamis" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Gunakan POST dengan body JSON: { amount: number, fee?: { type, value }, includeImage?: boolean }",
      example: {
        amount: 150000,
        fee: { type: "fixed", value: 0 },
        includeImage: true,
      },
    },
    { status: 405 }
  );
}
