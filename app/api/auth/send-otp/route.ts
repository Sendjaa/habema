import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { generateOTP, storeOTP, invalidatePreviousOTPs } from '@/lib/otp';
import { getResend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, turnstileToken, type, password, firstName, lastName } = body;

    if (!email || !type) {
      return NextResponse.json({ error: 'Email dan tipe OTP wajib diisi' }, { status: 400 });
    }

    if (type !== 'register' && type !== 'login') {
      return NextResponse.json({ error: 'Tipe OTP tidak valid' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (turnstileToken) {
      const isValidTurnstile = await verifyTurnstile(turnstileToken);
      if (!isValidTurnstile) {
        return NextResponse.json({ error: 'Verifikasi Turnstile gagal. Silakan coba lagi.' }, { status: 400 });
      }
    } else {
      const { data: existing } = await supabaseAdmin
        .from('otp_codes')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('type', type)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: 'Sesi OTP tidak ditemukan. Silakan mulai dari awal.' }, { status: 400 });
      }
    }

    if (type === 'register') {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
      }
      if (!firstName) {
        return NextResponse.json({ error: 'Nama depan wajib diisi' }, { status: 400 });
      }

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
        user_metadata: { full_name: `${firstName} ${lastName || ''}`.trim() },
      });

      if (createError) {
        if (createError.message?.includes('already been registered') || createError.status === 422) {
          return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
        }
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      await invalidatePreviousOTPs(normalizedEmail, 'register');
    }

    if (type === 'login') {
      if (!password) {
        return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
      }

      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
      }

      await invalidatePreviousOTPs(normalizedEmail, 'login');
    }

    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp, type);

    try {
      const resendClient = getResend();
      const { data: emailData, error: emailError } = await resendClient.emails.send({
        from: process.env.OTP_EMAIL_FROM || 'Habema <noreply@habema.com>',
        to: normalizedEmail,
        subject: type === 'register' ? 'Kode Verifikasi Email - Habema' : 'Kode Login - Habema',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #065f46;">Habema</h2>
            <p>${type === 'register' ? 'Terima kasih sudah mendaftar!' : 'Permintaan login diterima.'}</p>
            <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
            <div style="background: #f5f5f4; padding: 16px; border-radius: 12px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #065f46; margin: 16px 0;">
              ${otp}
            </div>
            <p style="color: #78716c; font-size: 14px;">Kode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
            <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;">
            <p style="color: #a8a29e; font-size: 12px;">Jika kamu tidak meminta kode ini, abaikan email ini.</p>
          </div>
        `,
      });

      if (emailError) {
        console.error('Resend send error:', emailError);
        const message = typeof emailError === 'object' && emailError !== null
          ? (emailError as any).message || JSON.stringify(emailError)
          : String(emailError);
        return NextResponse.json({
          error: `Gagal mengirim email: ${message}. Pastikan domain sudah diverifikasi di Resend Dashboard.`,
        }, { status: 500 });
      }
    } catch (emailError: any) {
      console.error('Failed to send OTP email:', emailError);
      const message = emailError?.message || 'Gagal mengirim email OTP';
      return NextResponse.json({ error: message + '. Cek Resend Dashboard untuk verifikasi domain.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: type === 'register'
        ? 'Kode OTP telah dikirim ke email untuk verifikasi pendaftaran.'
        : 'Kode OTP telah dikirim ke email untuk verifikasi login.',
    });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}