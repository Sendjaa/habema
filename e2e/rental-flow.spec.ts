import { test, expect } from '@playwright/test';

test('UAT: Rental flow from hero → catalog → booking → payment', async ({ page }) => {
  // 1. Hero section - fill rental dates
  await page.goto('/');
  
  // Wait for hero section to load
  await expect(page.getByRole('heading', { name: /Rental & Open Trip/ })).toBeVisible();
  
  // Select rental tab
  await page.getByRole('button', { name: 'Sewa Alat' }).click();
  
  // Fill dates (today + 2 days)
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.setDate(today.getDate() + 2)).toISOString().split('T')[0];
  
  await page.locator('input[type="date"]').first().fill(startDate);
  await page.locator('input[type="date"]').last().fill(endDate);
  
  // Click CTA button
  await page.getByRole('link', { name: 'Jelajahi Katalog Rental' }).click();
  
  // 2. Catalog - select first available equipment
  await expect(page).toHaveURL(/catalog_rental/);
  await expect(page.getByText('Gear Terfavorit')).toBeVisible();
  
  // Wait for products to load and click first product
  const firstProduct = page.locator('[data-testid="product-card"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 10000 });
  const productName = await firstProduct.getByRole('heading').textContent();
  await firstProduct.click();
  
  // 3. Product detail - add to cart and proceed to booking
  await expect(page).toHaveURL(/product\/[a-zA-Z0-9-]+/);
  await page.getByRole('button', { name: 'Tambah ke Keranjang' }).click();
  
  // Wait for toast and go to cart
  await expect(page.getByText('Berhasil ditambahkan ke keranjang')).toBeVisible();
  await page.getByRole('link', { name: 'Lanjutkan ke Booking' }).click();
  
  // 4. Booking flow - fill identity and conditions
  await expect(page).toHaveURL('/booking');
  
  // Fill identity form
  await page.getByLabel('Nama Lengkap').fill('Test User');
  await page.getByLabel('Nomor KTP').fill('1234567890123456');
  await page.getByLabel('Nomor Telepon').fill('081234567890');
  await page.getByLabel('Alamat Email').fill('test@example.com');
  
  // Accept conditions
  await page.getByLabel('Saya telah membaca dan menyetujui syarat & ketentuan').check();
  await page.getByLabel('Saya bertanggung jawab atas kerusakan').check();
  await page.getByLabel('Saya akan mengembalikan tepat waktu').check();
  
  // Continue to delivery
  await page.getByRole('button', { name: 'Lanjutkan ke Pengiriman' }).click();
  
  // 5. Delivery - fill location
  await expect(page.getByText('Detail Pengiriman')).toBeVisible();
  await page.getByLabel('Nama Penerima').fill('Test User');
  await page.getByLabel('Nomor Telepon Penerima').fill('081234567890');
  
  // Select pickup option (simpler than delivery)
  await page.getByLabel('Ambil Sendiri di Basecamp').check();
  
  await page.getByRole('button', { name: 'Lanjutkan ke Pembayaran' }).click();
  
  // 6. Payment - verify Midtrans loads
  await expect(page).toHaveURL('/payment');
  await expect(page.getByText('Pembayaran')).toBeVisible();
  
  // Wait for payment button and click
  const payButton = page.getByRole('button', { name: /Bayar Sekarang|Lanjutkan Pembayaran/ });
  await expect(payButton).toBeVisible({ timeout: 15000 });
  
  // Don't actually complete payment - just verify flow works
  console.log('✅ UAT rental flow completed successfully');
});