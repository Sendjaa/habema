import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    if (!password) {
      return NextResponse.json({ error: 'Password diperlukan untuk membuat sesi' }, { status: 400 });
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Gagal membuat sesi. Silakan login ulang.' }, { status: 500 });
    }

    // For register: confirm user email via admin API
    if (type === 'register' && signInData.user) {
      await supabaseAdmin.auth.admin.updateUserById(signInData.user.id, {
        email_confirm: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: type === 'register'
        ? 'Akun berhasil dibuat dan diverifikasi!'
        : 'Login berhasil!',
    });
  } catch (error: any) {
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}