import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { generateOTP, storeOTP, invalidatePreviousOTPs } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/otp-email';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth';

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

    // Di dev lokal tidak ada Turnstile yang bisa diselesaikan dan kode OTP
    // hanya ditulis ke terminal (lib/otp-email.ts), jadi pagar ini tidak
    // berlaku — sisanya tetap sama seperti production.
    if (!DEV_LOCAL_AUTH) {
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
      if (password) {
        const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
        }
      } else {
        // Passwordless: untuk user yang di-invite tanpa password (mis. via Supabase Invite).
        // Pastikan email benar-benar terdaftar di Supabase Auth sebelum mengirim OTP.
        // Jika query auth.users gagal (RLS/schema), jangan blokir — verifikasi final
        // dilakukan di verify-otp.
        try {
          const { data: authUser, error: userError } = await (supabaseAdmin as any)
            .from('auth.users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (!userError && !authUser) {
            return NextResponse.json({ error: 'Email tidak terdaftar' }, { status: 401 });
          }
          if (userError) {
            console.warn('auth.users check failed, proceeding without it:', userError.message);
          }
        } catch (checkError: any) {
          console.warn('auth.users check threw, proceeding without it:', checkError?.message);
        }
      }

      await invalidatePreviousOTPs(normalizedEmail, 'login');
    }

    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp, type);

    await sendOtpEmail(normalizedEmail, otp, type);

    return NextResponse.json({
      success: true,
      // Di dev kodenya tidak lewat email, dan terminal dev server belum tentu
      // terlihat oleh yang menguji — jadi kodenya ikut dikembalikan.
      ...(DEV_LOCAL_AUTH ? { devOtp: otp } : {}),
      message: type === 'register'
        ? 'Kode OTP telah dikirim ke email untuk verifikasi pendaftaran.'
        : 'Kode OTP telah dikirim ke email untuk verifikasi login.',
    });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}