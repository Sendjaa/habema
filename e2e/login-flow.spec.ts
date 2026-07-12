import { test, expect, type Page } from '@playwright/test';

// ===== Runtime error capture (UAT: laporkan semua error, jangan cuma fail cepat) =====
let consoleErrors: string[] = [];
let pageErrors: string[] = [];
let badResponses: string[] = []; // 4xx/5xx dengan URL

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  pageErrors = [];
  badResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(`${err.name}: ${err.message}`));
  // tangkap response 4xx/5xx beserta URL-nya
  page.on('response', (res) => {
    if (res.status() >= 400) {
      badResponses.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
});

test.afterEach(async ({}, testInfo) => {
  const report = { consoleErrors, pageErrors, badResponses };
  await testInfo.attach('runtime-errors', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  if (pageErrors.length || consoleErrors.length || badResponses.length) {
    console.log('\n=== RUNTIME ERRORS (UAT LOGIN) ===');
    pageErrors.forEach((e) => console.log('PAGEERROR:', e));
    consoleErrors.forEach((e) => console.log('CONSOLE:', e));
    badResponses.forEach((e) => console.log('HTTP>=400:', e));
    console.log('===============================\n');
  }
  // fail kalau ada runtime error (filter noise eksternal)
  const realConsole = consoleErrors.filter(
    (e) => !/Download the React DevTools|chunk|Failed to load resource|gstatic\.com|pinimg/i.test(e),
  );
  // 4xx/5xx di origin aplikasi sendiri = bug; eksternal (supabase/google) dianggap noise env
  const appOriginBad = badResponses.filter((r) => !/supabase\.co|gstatic\.com|pinimg|fonts\.|googleapis/i.test(r));
  expect.soft(pageErrors.length, `PAGE ERRORS:\n${pageErrors.join('\n')}`).toBe(0);
  expect
    .soft(realConsole.length, `CONSOLE ERRORS:\n${realConsole.join('\n')}`)
    .toBe(0);
  expect
    .soft(appOriginBad.length, `APP 4xx/5xx:\n${appOriginBad.join('\n')}`)
    .toBe(0);
});

async function waitToast(page: Page, text: RegExp, timeout = 15000) {
  await expect
    .soft(page.getByText(text).first())
    .toBeVisible({ timeout });
}

// ============ 1. /login (customer) ============
test('UAT Login customer: render, switch mode, validasi & error path', async ({ page }) => {
  // ---------- Render ----------
  await test.step('Halaman /login tampil tanpa error', async () => {
    await page.goto('/login');
    await expect
      .soft(page.getByRole('heading', { name: /Halo, Petualang!/i }))
      .toBeVisible({ timeout: 15000 });
    await expect.soft(page.getByPlaceholder('Email')).toBeVisible();
    await expect.soft(page.getByPlaceholder('Password')).toBeVisible();
    await expect
      .soft(page.getByRole('button', { name: /Login dengan Google/i }))
      .toBeVisible();
  });

  // ---------- Switch ke register ----------
  await test.step('Tab Daftar aktif & form register muncul', async () => {
    await page.getByRole('button', { name: 'Daftar', exact: true }).click();
    await expect
      .soft(page.getByRole('heading', { name: /Mulai Petualanganmu/i }))
      .toBeVisible({ timeout: 8000 });
    await expect.soft(page.getByPlaceholder('Nama depan')).toBeVisible();
    await expect.soft(page.getByPlaceholder('Nama belakang')).toBeVisible();
  });

  // ---------- Switch ke login ----------
  await test.step('Kembali ke tab Masuk', async () => {
    await page.getByRole('button', { name: 'Masuk' }).first().click();
    await expect
      .soft(page.getByRole('heading', { name: /Halo, Petualang!/i }))
      .toBeVisible({ timeout: 8000 });
  });

  // ---------- Forgot password ----------
  await test.step('Link Lupa password → form reset email', async () => {
    await page.getByRole('button', { name: 'Lupa password?' }).click();
    await expect
      .soft(page.getByRole('heading', { name: /Lupa Password\?/i }))
      .toBeVisible({ timeout: 8000 });
    // submit dgn email valid → Supabase kirim link (atau error), bukan crash
    await page.getByPlaceholder('Email').fill('user@contoh.com');
    await page.locator('form button[type="submit"]').click();
    await expect
      .soft(
        page
          .getByText(/Link reset password telah dikirim|terjadi kesalahan|Invalid/i)
          .first(),
      )
      .toBeVisible({ timeout: 15000 });
    // reset state untuk step berikutnya
    await page.goto('/login');
  });

  // ---------- Validasi: password < 6 karakter (non-empty, lewat required) ----------
  await test.step('Validasi: password < 6 karakter → pesan error', async () => {
    await page.getByPlaceholder('Email').fill('user@contoh.com');
    await page.getByPlaceholder('Password').fill('123');
    await page.locator('form button[type="submit"]').click();
    await expect
      .soft(page.getByText(/Password minimal 6 karakter/i))
      .toBeVisible({ timeout: 8000 });
  });

  // ---------- Error path: kredensial salah (Supabase nyata) ----------
  await test.step('Login kredensial salah → error Supabase muncul', async () => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('user.tidak.ada@contoh.com');
    await page.getByPlaceholder('Password').fill('salah123');
    await page.locator('form button[type="submit"]').click();
    // pesan error merah (dari setMessage) atau toast
    await expect
      .soft(
        page
          .getByText(/Invalid login credentials|Email atau password|terjadi kesalahan/i)
          .first(),
      )
      .toBeVisible({ timeout: 15000 });
  });
});

// ============ 2. /admin/login ============
test('UAT Login admin: render, validasi & error path', async ({ page }) => {
  await test.step('Halaman /admin/login tampil', async () => {
    await page.goto('/admin/login');
    await expect
      .soft(page.getByRole('heading', { name: /Admin Login/i }))
      .toBeVisible({ timeout: 15000 });
    await expect.soft(page.locator('#email')).toBeVisible();
    await expect.soft(page.locator('#password')).toBeVisible();
  });

  await test.step('Validasi: password < 6 karakter → toast error', async () => {
    await page.locator('#email').fill('admin@habema.com');
    await page.locator('#password').fill('123');
    await page.locator('form button[type="submit"]').click();
    await waitToast(page, /Password minimal 6 karakter/i);
  });

  await test.step('Login kredensial salah → toast error', async () => {
    await page.locator('#email').fill('admin@habema.com');
    await page.locator('#password').fill('salah123');
    await page.locator('form button[type="submit"]').click();
    await waitToast(page, /Email atau password salah|Login gagal|tidak diizinkan/i);
  });

  // reset password (link dikirim → toast sukses/error, bukan crash)
  await test.step('Reset password jalan tanpa crash', async () => {
    await page.getByRole('button', { name: /Reset Password/i }).click();
    await expect
      .soft(
        page
          .getByText(/Link reset password telah dikirim|Gagal mengirim reset password/i)
          .first(),
      )
      .toBeVisible({ timeout: 15000 });
  });
});

// ============ 3. Runtime-error assert ditangani di afterEach ============
