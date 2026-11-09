import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { issueAdminDeviceTrust } from '@/lib/admin-trust';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, type, password } = body;

    if (!email || !otp || !type) {
      return NextResponse.json({ error: 'Email, kode OTP, dan tipe wajib diisi' }, { status: 400 });
    }

    if (type !== 'register' && type !== 'login') {
      return NextResponse.json({ error: 'Tipe OTP tidak valid' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOTP(normalizedEmail, otp, type);
    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    let sessionData: any = null;
    let passwordless = false;

    // Untuk register, user dibuat dengan email_confirm: false di send-otp.
    // Konfirmasi email via admin API terlebih dahulu (OTP sudah membuktikan
    // kepemilikan email) supaya signInWithPassword di bawah tidak ditolak.
    if (type === 'register') {
      try {
        const { data: authUsers, error: listError } =
          await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const target = authUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === normalizedEmail,
        );
        if (!listError && target) {
          await supabaseAdmin.auth.admin.updateUserById(target.id, {
            email_confirm: true,
          });
        }
      } catch (err: any) {
        console.warn('verify-otp: gagal pre-confirm email:', err?.message);
      }
    }

    if (password) {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        return NextResponse.json({ error: 'Gagal membuat sesi. Silakan login ulang.' }, { status: 500 });
      }
      sessionData = signInData;
    } else {
      // Passwordless: user di-invite tanpa password. Buat sesi via magic link
      // menggunakan admin API lalu redeem token-nya untuk mendapatkan session.
      passwordless = true;

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
      });

      const token = linkData?.properties?.hashed_token;

      if (linkError || !token) {
        return NextResponse.json({ error: 'Gagal membuat sesi. Silakan login ulang.' }, { status: 500 });
      }

      const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'magiclink',
      });

      if (verifyError || !data?.session) {
        return NextResponse.json({ error: 'Gagal membuat sesi. Silakan login ulang.' }, { status: 500 });
      }
      sessionData = data;
    }

    // For register: confirm user email via admin API
    if (type === 'register' && sessionData.user) {
      await supabaseAdmin.auth.admin.updateUserById(sessionData.user.id, {
        email_confirm: true,
      });
    }

    // OTP login berhasil → catat perangkat ini supaya beberapa hari ke depan
    // tidak perlu kode lagi. Hanya untuk admin: login pelanggan tidak boleh
    // meninggalkan baris di tabel kepercayaan perangkat admin.
    if (type === 'login' && sessionData.user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('is_vendor')
        .eq('id', sessionData.user.id)
        .maybeSingle();

      if (profile?.is_vendor) {
        await issueAdminDeviceTrust(sessionData.user.id, normalizedEmail);
      }
    }

    const session = sessionData?.session;

    return NextResponse.json({
      success: true,
      message: type === 'register'
        ? 'Akun berhasil dibuat dan diverifikasi!'
        : 'Login berhasil!',
      ...(passwordless && session
        ? {
            passwordless: true,
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_in: session.expires_in,
            },
          }
        : {}),
    });
  } catch (error: any) {
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}