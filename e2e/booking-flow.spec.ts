import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

// ===== Runtime error capture (UAT: laporkan semua error, jangan cuma fail cepat) =====
let consoleErrors: string[] = [];
let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(`${err.name}: ${err.message}`));
});

test.afterEach(async ({}, testInfo) => {
  const report = {
    consoleErrors,
    pageErrors,
  };
  await testInfo.attach('runtime-errors', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  if (pageErrors.length || consoleErrors.length) {
    pageErrors.forEach((e) => console.log('PAGEERROR:', e));
    consoleErrors.forEach((e) => console.log('CONSOLE:', e));
    console.log('===========================\\n');
  }
});

const START = '2026-07-20';
const END = '2026-07-22';

async function fillHeroDates(page: Page) {
  const rentalTab = page.getByRole('button', { name: /Sewa Alat/i });
  if (await rentalTab.count()) await rentalTab.first().click();
  const dates = page.locator('input[type="date"]');
  await expect.soft(dates.nth(0)).toBeVisible({ timeout: 10000 });
  await dates.nth(0).fill(START);
  await dates.nth(1).fill(END);
}

test('UAT full flow: hero → katalog → pilih alat → booking → identitas → pembayaran → konfirmasi', async ({ page }) => {
  const fixture = path.resolve('e2e/fixtures/id-sample.png');

  // ---------- 1. HERO SECTION ----------
  await test.step('Hero: isi form sewa & buka katalog', async () => {
    await page.goto('/');
    await expect.soft(page.getByRole('heading', { name: /Sewa Alat Camping & Outdoor Terpercaya/i })).toBeVisible({ timeout: 15000 });
    await fillHeroDates(page);
    await page.getByRole('link', { name: /Jelajahi Katalog Rental/i }).click();
    await expect.soft(page).toHaveURL(/catalog_rental/, { timeout: 10000 });
  });

  // ---------- 2. KATALOG: PILIH ALAT ----------
  await test.step('Katalog: produk tampil & klik produk pertama', async () => {
    const cards = page.locator('a[href^="/product/"]');
    await expect.soft(cards.first()).toBeVisible({ timeout: 20000 });
    const n = await cards.count();
    expect.soft(n, `Jumlah produk di katalog = ${n} (harus > 0)`).toBeGreaterThan(0);
    await cards.first().click();
    await expect.soft(page).toHaveURL(/\/product\//, { timeout: 10000 });
  });

  // ---------- 3. PRODUK → BOOKING ----------
  await test.step('Produk: buka halaman booking', async () => {
    const bookingLink = page.locator('a[href^="/booking?id="]');
    await expect.soft(bookingLink.first()).toBeVisible({ timeout: 15000 });
    await bookingLink.first().click();
    await expect.soft(page).toHaveURL(/\/booking/, { timeout: 10000 });
    // produk harus load (header "Selesaikan Pembayaran" muncul)
    await expect.soft(page.getByText(/Selesaikan Pembayaran/i)).toBeVisible({ timeout: 25000 });
    await expect.soft(page.getByText(/Produk tidak ditemukan/i)).toHaveCount(0);
  });

  // ---------- 4. STEP 1: JADWAL SEWA ----------
  await test.step('Step 1: tanggal prefill & Lanjutkan', async () => {
    await page.getByRole('button', { name: 'Lanjutkan' }).first().click();
    await expect.soft(page.locator('#terms')).toBeVisible({ timeout: 10000 });
  });

  // ---------- 5. STEP 2: SYARAT & KONDISI ----------
  await test.step('Step 2: centang terms & Lanjutkan', async () => {
    await page.locator('#terms').click();
    await page.getByRole('button', { name: 'Lanjutkan' }).click();
    await expect.soft(page.getByPlaceholder('Masukkan KTP')).toBeVisible({ timeout: 10000 });
  });

  // ---------- 6. STEP 3: VERIFIKASI IDENTITAS ----------
  await test.step('Step 3: isi identitas & upload foto', async () => {
    await page.getByPlaceholder('Masukkan KTP').fill('3201234567890123');
    await page.getByPlaceholder('Masukkan nama sesuai ID').fill('Budi Uji');
    await page.setInputFiles('#id-upload', fixture);
    await expect.soft(page.getByAltText('Preview')).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: 'Verifikasi Identitas' }).click();
    // analisa 2s (mock) lalu lanjut ke step 4
    await expect.soft(page.getByText('WhatsApp Konfirmasi')).toBeVisible({ timeout: 15000 });
  });

  // ---------- 7. STEP 4: PEMBAYARAN (guest → WhatsApp) ----------
  await test.step('Step 4: pilih WhatsApp & selesaikan', async () => {
    await page.getByText('WhatsApp Konfirmasi').click();
    await page.getByRole('button', { name: /Pesan via WhatsApp/i }).click();
    await expect.soft(page).toHaveURL(/order-confirmation/, { timeout: 20000 });
  });

  // ---------- 8. RINGKASAN ERROR ----------
  await test.step('Assert: tidak ada runtime error', async () => {
    expect.soft(pageErrors.length, `PAGE ERRORS:\n${pageErrors.join('\n')}`).toBe(0);
    // console error yang bukan warning/chunk biasa
    const real = consoleErrors.filter((e) => !/Download the React DevTools|chunk|Failed to load resource.*favicon/i.test(e));
    expect.soft(real.length, `CONSOLE ERRORS:\n${real.join('\n')}`).toBe(0);
  });
});
