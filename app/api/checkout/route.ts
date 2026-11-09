import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createMidtransTransaction,
  generateOrderId,
  isMidtransConfigured,
} from "@/lib/midtrans";
import { appendFileSync } from "fs";
import { join } from "path";

// Debug log hanya aktif di development & tidak pernah menulis PII ke repo.
const debugEnabled = process.env.NODE_ENV !== "production";
function debugLog(msg: string) {
  if (!debugEnabled) return;
  try {
    appendFileSync(
      join(process.cwd(), ".checkout-debug.log"),
      `[${new Date().toISOString()}] ${msg}\n`
    );
  } catch {}
}

const isProduction = process.env.MIDTRANS_PRODUCTION === "true";
const allowMock = !isProduction && process.env.MIDTRANS_ALLOW_MOCK === "true";

async function getServerUser(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    return user ?? null;
  } catch (error) {
    console.error("[checkout] auth getUser failed:", error);
    return null;
  }
}

// Hitung diskon dari data voucher yang DIVERIFIKASI dari DB (bukan dari client).
function computeDiscount(
  disc: any,
  subtotal: number,
  items: any[]
): number {
  if (!disc) return 0;
  const qualifiesItems =
    disc.applies_to === "all" ||
    (disc.applies_to === "category" &&
      items.some((i) => i.category === disc.target_id)) ||
    (disc.applies_to === "equipment" &&
      items.some((i) => i.id === disc.target_id));
  if (!qualifiesItems) return 0;
  if ((Number(disc.min_purchase) || 0) > subtotal) return 0;

  let amount = 0;
  if (disc.discount_type === "percentage") {
    amount = (subtotal * Number(disc.discount_value)) / 100;
    if (disc.max_discount) {
      amount = Math.min(amount, Number(disc.max_discount));
    }
  } else if (disc.discount_type === "fixed") {
    amount = Math.min(Number(disc.discount_value), subtotal);
  }
  return Math.max(0, amount);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerDetails, claimedDiscount } = body;
    const deliveryCost = Math.max(0, Number(body.deliveryCost) || 0);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Item kosong" }, { status: 400 });
    }
    if (
      !customerDetails?.customer_name ||
      !customerDetails?.phone ||
      !customerDetails?.address
    ) {
      return NextResponse.json(
        { error: "Data pelanggan belum lengkap" },
        { status: 400 }
      );
    }

    // --- 0) Verifikasi user dari sesi server (bukan dari body) ---
    const sessionUser = await getServerUser(request);
    const userId = sessionUser?.id ?? null;

    // --- 1) Ambil data produk asli dari DB ---
    const productIds = items.map((it: any) => it.id).filter(Boolean);
    const { data: rawProducts, error: productsError } = await (supabaseAdmin as any)
      .from("shop_products")
      .select("id, name, price, stock, is_available, category")
      .in("id", productIds);

    if (productsError) {
      console.error("[checkout] fetch products error:", productsError.message);
      debugLog("FETCH PRODUCTS ERROR: " + JSON.stringify(productsError));
      return NextResponse.json(
        { error: "Gagal memuat produk" },
        { status: 500 }
      );
    }

    const products: any[] = rawProducts || [];
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // --- 2) Validasi item & hitung subtotal dari HARGA DB ---
    const qtyByProduct = new Map<string, number>();
    let subtotal = 0;
    for (const it of items) {
      const product = productMap.get(it.id);
      if (!product) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan: ${it.id}` },
          { status: 400 }
        );
      }
      if (!product.is_available) {
        return NextResponse.json(
          { error: `Produk tidak tersedia: ${product.name}` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      const currentQty = qtyByProduct.get(it.id) || 0;
      const totalQty = currentQty + qty;
      if (Number(product.stock) < totalQty) {
        return NextResponse.json(
          {
            error: `Stok tidak mencukupi untuk ${product.name}. Stok tersisa: ${product.stock}`,
          },
          { status: 400 }
        );
      }
      qtyByProduct.set(it.id, totalQty);
      subtotal += Number(product.price) * qty;
    }
    subtotal = Math.round(subtotal);

    // --- 3) Validasi voucher dari DB ---
    let discountAmount = 0;
    let appliedDiscount: any = null;
    if (claimedDiscount?.id || claimedDiscount?.code) {
      let query = (supabaseAdmin as any)
        .from("discounts")
        .select("*")
        .eq("is_active", true);
      if (claimedDiscount.id) query = query.eq("id", claimedDiscount.id);
      else query = query.eq("code", claimedDiscount.code);

      const { data: discountRow, error: discountError } = await query
        .in("discount_type", ["percentage", "fixed"])
        .maybeSingle();

      if (discountError) {
        console.error("[checkout] fetch discount error:", discountError.message);
        debugLog("FETCH DISCOUNT ERROR: " + JSON.stringify(discountError));
      } else if (discountRow) {
        // Cek periode berlaku & batas pemakaian
        const now = new Date();
        const active =
          (!discountRow.start_date || new Date(discountRow.start_date) <= now) &&
          (!discountRow.end_date || new Date(discountRow.end_date) >= now);
        const hasQuota =
          !discountRow.usage_limit ||
          Number(discountRow.usage_count) < Number(discountRow.usage_limit);

        if (active && hasQuota) {
          // Validasi voucher_type: voucher khusus rental/opentrip tidak bisa dipakai di shop
          const voucherType = discountRow.voucher_type || 'all';
          if (voucherType === 'rental' || voucherType === 'opentrip') {
            debugLog("REJECTED: voucher " + discountRow.code + " adalah " + voucherType + ", tidak bisa dipakai untuk belanja");
            return NextResponse.json(
              { error: `Voucher ${discountRow.code} hanya berlaku untuk ${voucherType}, tidak bisa dipakai untuk belanja produk` },
              { status: 400 }
            );
          }
          // Validasi conditions: first_time_only
          if (discountRow.conditions && discountRow.conditions.first_time_only && userId) {
            const { data: pastOrders } = await (supabaseAdmin as any)
              .from("shop_orders")
              .select("id")
              .eq("user_id", userId)
              .limit(1);
            if (pastOrders && pastOrders.length > 0) {
              debugLog("REJECTED: voucher " + discountRow.code + " hanya untuk pembeli baru");
              return NextResponse.json(
                { error: `Voucher ${discountRow.code} hanya berlaku untuk pembeli pertama kali` },
                { status: 400 }
              );
            }
          }
          // Validasi conditions: must_invite_friends
          if (discountRow.conditions && discountRow.conditions.must_invite_friends) {
            const minFriends = discountRow.conditions.min_friends || 1;
            // TODO: Cek apakah user sudah mengundang teman yang terdaftar
            // Untuk sementara, reject jika condition ini ada
            debugLog("REJECTED: voucher " + discountRow.code + " memerlukan undangan teman");
            return NextResponse.json(
              { error: `Voucher ${discountRow.code} memerlukan undangan minimal ${minFriends} teman yang terdaftar` },
              { status: 400 }
            );
          }
          const amount = computeDiscount(discountRow, subtotal, items);
          if (amount > 0) {
            discountAmount = amount;
            appliedDiscount = discountRow;
          }
        }
      }
    }

    const grossAmount = Math.round(
      subtotal - discountAmount + deliveryCost
    );

    if (grossAmount <= 0) {
      return NextResponse.json(
        { error: "Total pembayaran tidak valid" },
        { status: 400 }
      );
    }

    const orderId = generateOrderId("SHOP");

    // --- 4) Simpan order ke database ---
    const { data: order, error: orderError } = await (supabaseAdmin as any)
      .from("shop_orders")
      .insert({
        user_id: userId,
        customer_name: customerDetails.customer_name,
        phone: customerDetails.phone,
        email: customerDetails.email || null,
        address: customerDetails.address,
        city: customerDetails.city || null,
        postal_code: customerDetails.postal_code || null,
        note: customerDetails.note || null,
        subtotal: subtotal,
        discount_amount: Math.round(discountAmount),
        delivery_cost: Number(deliveryCost),
        total_amount: grossAmount,
        order_id: orderId,
        status: "pending",
        payment_status: "pending",
        payment_method: customerDetails.payment_method || "midtrans",
        ...(appliedDiscount ? { discount_id: appliedDiscount.id } : {}),
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("[checkout] insert order error:", orderError.message);
      debugLog("INSERT ORDER ERROR: " + JSON.stringify(orderError));
      return NextResponse.json(
        { error: "Gagal membuat order" },
        { status: 500 }
      );
    }

    // --- 5) Simpan item order (nama & harga dari DB, bukan client) ---
    const orderItems = items.map((it: any) => {
      const product = productMap.get(it.id);
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      const price = Number(product?.price) || 0;
      return {
        order_id: order.id,
        product_id: it.id,
        name: product?.name || it.name,
        price,
        quantity: qty,
        total: Math.round(price * qty),
      };
    });

    const { error: itemsError } = await (supabaseAdmin as any)
      .from("shop_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[checkout] insert items error:", itemsError.message);
      debugLog("INSERT ITEMS ERROR: " + JSON.stringify(itemsError));
      // Rollback: hapus order yang baru dibuat agar tidak jadi "yatim" tanpa item
      await (supabaseAdmin as any)
        .from("shop_orders")
        .delete()
        .eq("id", order.id);
      return NextResponse.json(
        { error: "Gagal menyimpan item order" },
        { status: 500 }
      );
    }
    debugLog("STEP ok: order + items inserted. order_id=" + orderId);

    const paymentMethod = customerDetails.payment_method || "midtrans";

    // --- 6) COD — tanpa Midtrans, langsung selesai ---
    if (paymentMethod === "cod") {
      await (supabaseAdmin as any)
        .from("shop_orders")
        .update({ payment_status: "cod" })
        .eq("id", order.id);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentOrderId: orderId,
        cod: true,
        grossAmount,
      });
    }

    // --- 7) Midtrans belum terkonfigurasi ---
    if (!isMidtransConfigured()) {
      if (allowMock) {
        return NextResponse.json({
          success: true,
          orderId: order.id,
          paymentOrderId: orderId,
          token: "mock-token-" + orderId,
          redirect_url: `${request.headers.get("x-forwarded-proto") || "http"}://${
            request.headers.get("host") || "localhost:3000"
          }/payment/finish?order_id=${orderId}`,
          mock: true,
        });
      }
      return NextResponse.json(
        { error: "Payment system not configured." },
        { status: 500 }
      );
    }

    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    // --- 8) Bangun item_details untuk Midtrans (nama max 50 char) ---
    const itemDetails = orderItems.map((it: any) => ({
      id: it.product_id,
      name: String(it.name || "Produk").slice(0, 50),
      price: it.price,
      quantity: it.quantity,
      category: "Shop",
    }));
    if (deliveryCost > 0) {
      itemDetails.push({
        id: "delivery",
        name: "Biaya Pengiriman",
        price: Math.round(Number(deliveryCost)),
        quantity: 1,
        category: "Delivery",
      });
    }
    if (discountAmount > 0) {
      itemDetails.push({
        id: "discount",
        name: "Diskon",
        price: -Math.round(discountAmount),
        quantity: 1,
        category: "Discount",
      });
    }

    // Peta metode pembayaran → channel Midtrans (Snap hanya menampilkan channel ini)
    // Daftar lengkap channel Midtrans: https://docs.midtrans.com/reference/snap-api#enabled-payments
    const ENABLED_PAYMENTS: Record<string, string[]> = {
      // Virtual Accounts
      bca_va: ["bca_va"],
      bni_va: ["bni_va"],
      bri_va: ["bri_va"],
      mandiri_va: ["mandiri_va"],
      permata_va: ["permata_va"],
      bsi_va: ["bsi_va"],
      cimb_va: ["cimb_va"],
      maybank_va: ["maybank_va"],
      // E-Wallets
      gopay: ["gopay"],
      shopeepay: ["shopeepay"],
      dana: ["dana"],
      ovo: ["ovo"],
      linkaja: ["linkaja"],
      // Credit/Debit Cards (Midtrans handles card processing)
      credit_card: ["credit_card"],
      // QRIS
      qris: ["qris"],
      // Retail/Convenience Store
      alfamart: ["alfamart"],
      indomaret: ["indomaret"],
    };

    const transactionData = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: customerDetails.customer_name,
        last_name: "",
        email: customerDetails.email || "noemail@habema.local",
        phone: customerDetails.phone,
      },
      enabled_payments: ENABLED_PAYMENTS[paymentMethod] || undefined,
      callbacks: {
        finish: `${baseUrl}/payment/finish`,
        error: `${baseUrl}/payment/error`,
        pending: `${baseUrl}/payment/pending`,
      },
    };

    const result = await createMidtransTransaction(transactionData);
    debugLog("MIDTRANS RESULT: " + JSON.stringify(result));

    if (!result.success) {
      console.error("[checkout] Midtrans error:", result.error);
      debugLog("MIDTRANS ERROR: " + JSON.stringify(result));
      return NextResponse.json(
        { error: "Gagal memproses pembayaran" },
        { status: 500 }
      );
    }

    // --- 8) Simpan token (periksa error agar tidak sukses-semu) ---
    const { error: tokenError } = await (supabaseAdmin as any)
      .from("shop_orders")
      .update({ midtrans_token: result.token })
      .eq("id", order.id);

    if (tokenError) {
      console.error("[checkout] update token error:", tokenError.message);
      debugLog("UPDATE TOKEN ERROR: " + JSON.stringify(tokenError));
      return NextResponse.json(
        { error: "Gagal menyimpan token pembayaran" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentOrderId: orderId,
      token: result.token,
      redirect_url: result.redirect_url,
      grossAmount,
    });
  } catch (error: any) {
    console.error("[checkout] error:", error);
    debugLog(
      "CATCH: " +
        (error?.stack || error?.message || String(error))
    );
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
