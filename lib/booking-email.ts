// =====================================================================
// Email transaksional booking (QRIS manual) — gaya bahasa semi-formal.
// Semua fungsi best-effort: gagal kirim TIDAK menggagalkan alur utama.
// Memakai pola yang sama dengan OTP (lib/resend.ts + OTP_EMAIL_FROM).
// =====================================================================

import { getResend } from './resend';

const FROM = process.env.OTP_EMAIL_FROM || 'Habema <noreply@habema.com>';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// Logo wajib URL absolut (email tidak bisa memuat path relatif seperti /images/...).
// Ganti nama file di bawah bila ingin memakai varian logo lain.
const LOGO_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://habema.biz.id'}/images/logo-light.png`;

function shortId(id: string): string {
  return `#${String(id || '').slice(0, 8).toUpperCase()}`;
}

function rupiah(n: number | null | undefined): string {
  return `Rp${Number(n || 0).toLocaleString('id-ID')}`;
}

function shell(subject_title: string, greeting: string, body: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1c1917;">
      <div style="background: #1B4332; padding: 20px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <img src="${LOGO_URL}" alt="Habema Outdoor" width="140" style="max-width: 140px; height: auto; display: inline-block;" />
        <p style="margin: 8px 0 0; color: #d6d3d1; font-size: 13px;">${subject_title}</p>
      </div>
      <div style="border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">${greeting},</p>
        ${body}
        <p style="margin-bottom: 4px;">Salam,</p>
        <p style="margin-top: 0; font-weight: bold; color: #065f46;">Tim Habema Outdoor</p>
      </div>
      <p style="color: #a8a29e; font-size: 12px; text-align: center; margin-top: 16px;">
        Email ini dikirim otomatis, mohon tidak membalas.<br>
        Untuk bantuan lebih lanjut, silakan hubungi admin kami melalui WhatsApp.
      </p>
    </div>
  `;
}

function summaryBox(bookingId: string, total: number | null | undefined): string {
  return `
    <table style="width: 100%; background: #f5f5f4; border-radius: 8px; margin: 16px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 16px; font-size: 14px; color: #57534e;">ID Pesanan</td>
        <td style="padding: 12px 16px; font-size: 14px; text-align: right;"><strong>${shortId(bookingId)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 14px; color: #57534e; border-top: 1px solid #e7e5e4;">Total Tagihan</td>
        <td style="padding: 12px 16px; font-size: 14px; text-align: right;"><strong>${rupiah(total)}</strong></td>
      </tr>
    </table>
  `;
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[booking-email] RESEND_API_KEY belum diset, email dilewati.');
      return false;
    }
    const client = getResend();
    const { error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error('[booking-email] Resend error:', error);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[booking-email] Gagal kirim email:', e?.message || e);
    return false;
  }
}

/** Ke pelanggan: bukti pembayaran diterima, menunggu verifikasi admin. */
export async function sendProofReceivedEmail(
  to: string,
  opts: { bookingId: string; total?: number | null },
): Promise<boolean> {
  return send(
    to,
    `[Habema] Bukti Pembayaran ${shortId(opts.bookingId)} Telah Diterima`,
    shell(
      'Konfirmasi Penerimaan Bukti Pembayaran',
      'Halo,',
      `<p>Terima kasih sudah memesan di Habema Outdoor!</p>
       <p>Bukti pembayaran QRIS Anda sudah kami terima dan sedang diverifikasi admin (maks. 1×24 jam pada jam operasional).</p>
       ${summaryBox(opts.bookingId, opts.total)}
       <p>Pesanan akan langsung kami proses setelah pembayaran disetujui. Kabar selanjutnya menyusul via email.</p>`,
    ),
  );
} 

/** Ke admin: ada bukti baru yang perlu diverifikasi. */
export async function sendNewProofAdminEmail(
  opts: { bookingId: string; total?: number | null; customerEmail?: string | null },
): Promise<boolean> {
  if (!ADMIN_EMAIL) {
    console.warn('[booking-email] ADMIN_EMAIL belum diset, email admin dilewati.');
    return false;
  }
  return send(
    ADMIN_EMAIL,
    `[Habema] Verifikasi Pembayaran Diperlukan — ${shortId(opts.bookingId)}`,
    shell(
      'Permintaan Verifikasi Pembayaran',
      'Halo Tim Admin,',
      `<p>Ada bukti pembayaran QRIS baru yang perlu diverifikasi di dashboard admin.</p>
       ${summaryBox(opts.bookingId, opts.total)}
       <p style="margin: 4px 0;">Email pelanggan: <strong>${opts.customerEmail || '-'}</strong></p>
       <p>Pastikan nominalnya sesuai dengan mutasi sebelum menyetujui atau menolak.</p>`,
    ),
  );
}

/** Ke pelanggan: hasil verifikasi admin (setujui / tolak). */
export async function sendPaymentDecisionEmail(
  to: string,
  opts: { bookingId: string; total?: number | null; approved: boolean },
): Promise<boolean> {
  if (opts.approved) {
    return send(
      to,
      `[Habema] Pembayaran ${shortId(opts.bookingId)} Telah Disetujui`,
      shell(
        'Pemberitahuan Persetujuan Pembayaran',
        'Halo,',
        `<p>Kabar baik — pembayaran Anda sudah kami verifikasi dan pesanan dinyatakan <strong>terkonfirmasi</strong>.</p>
         ${summaryBox(opts.bookingId, opts.total)}
         <p>Tunjukkan ID pesanan di atas saat pengambilan barang di cabang yang dipilih. Sampai jumpa!</p>`,
      ),
    );
  }
  return send(
    to,
    `[Habema] Pembayaran ${shortId(opts.bookingId)} Belum Dapat Diproses`,
      shell(
        'Pemberitahuan Status Pembayaran',
        'Halo,',
        `<p>Mohon maaf, bukti pembayaran yang Anda kirim belum bisa kami verifikasi (biasanya karena nominal tidak sesuai atau bukti kurang jelas), jadi pesanan ini kami batalkan dan stoknya kami kembalikan.</p>
         ${summaryBox(opts.bookingId, opts.total)}
         <p>Kalau tetap ingin menyewa, silakan buat pesanan baru dengan bukti yang sesuai, atau hubungi admin via WhatsApp — kami bantu sampai beres.</p>`,
      ),
  );
}
