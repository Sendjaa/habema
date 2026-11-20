// Build .pptx (OpenXML) tanpa dependensi: zlib + fs bawaan Node.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'

const OUT = 'presentasi/habema-transaksi-digital.pptx'
mkdirSync('presentasi', { recursive: true })

// ---------- ZIP ----------
const TBL = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TBL[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const DOS_TIME = (11 << 11) | (30 << 5) | 0
const DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 15
function zip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const { name, data } of files) {
    const nb = Buffer.from(name, 'utf8')
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
    const def = deflateRawSync(raw)
    const crc = crc32(raw)
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6)
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(DOS_TIME, 10); lh.writeUInt16LE(DOS_DATE, 12)
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(raw.length, 22)
    lh.writeUInt16LE(nb.length, 26); lh.writeUInt16LE(0, 28)
    locals.push(lh, nb, def)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6)
    ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(DOS_TIME, 12)
    ch.writeUInt16LE(DOS_DATE, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(def.length, 20)
    ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt16LE(0, 30)
    ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36)
    ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42)
    centrals.push(Buffer.concat([ch, nb]))
    offset += lh.length + nb.length + def.length
  }
  const cd = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20)
  return Buffer.concat([...locals, cd, eocd])
}

// ---------- XML helpers ----------
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const EMU = (n) => Math.round(n * 914400)
const W = 12192000, H = 6858000

let sid = 2
function sp(shape) { sid++; return shape(sid) }

function rect(x, y, w, h, fill) {
  return sp((i) => `<p:sp><p:nvSpPr><p:cNvPr id="${i}" name="r${i}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${EMU(x)}" y="${EMU(y)}"/><a:ext cx="${EMU(w)}" cy="${EMU(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></p:spPr></p:sp>`)
}

// par: {t, sz, b, color, marL, indent, bullet, spc}
// pPr child order per CT_TextParagraphProperties: lnSpc, spcBef, spcAft,
// buClr, buSzPct, buFont, buChar/buNone, tabLst, defRPr, extLst
function par(p) {
  const txt = p.t || ''
  const sz = p.sz || 1800
  const b = p.b ? 1 : 0
  const col = p.color || '1F2937'
  const marL = p.marL ?? 0
  const indent = p.indent ?? 0
  const space = p.spc ? `<a:spcBef><a:spcPts val="${p.spc}"/></a:spcBef>` : ''
  const bu = p.bullet
    ? `<a:buClr><a:srgbClr val="${p.buColor || 'F97316'}"/></a:buClr><a:buSzPct val="90000"/><a:buFont typeface="Arial"/><a:buChar char="${p.bullet === 1 ? '•' : '▪'}"/>`
    : '<a:buNone/>'
  return `<a:p><a:pPr marL="${marL}" indent="${indent}">${space}${bu}<a:defRPr sz="${sz}" b="${b}"><a:solidFill><a:srgbClr val="${col}"/></a:solidFill></a:defRPr></a:pPr><a:r><a:rPr lang="id-ID" sz="${sz}" b="${b}" dirty="0"><a:solidFill><a:srgbClr val="${col}"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>${esc(txt)}</a:t></a:r></a:p>`
}

function textBox(x, y, w, h, pars, anchor) {
  const body = pars.map(par).join('')
  return sp((i) => `<p:sp><p:nvSpPr><p:cNvPr id="${i}" name="t${i}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${EMU(x)}" y="${EMU(y)}"/><a:ext cx="${EMU(w)}" cy="${EMU(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="${anchor || 't'}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${body}</p:txBody></p:sp>`)
}

// ---------- static parts ----------
const SLIDE_R = `${REL_NS}/slide`
const MASTER_R = `${REL_NS}/slideMaster`
const LAYOUT_R = `${REL_NS}/slideLayout`
const THEME_R = `${REL_NS}/theme`

const grpSpPr = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`

const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<a:theme ${NS} name="Habema"><a:themeElements><a:clrScheme name="Habema"><a:dk1><a:srgbClr val="1F2937"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="0F766E"/></a:dk2><a:lt2><a:srgbClr val="F7F5F0"/></a:lt2><a:accent1><a:srgbClr val="0F766E"/></a:accent1><a:accent2><a:srgbClr val="F97316"/></a:accent2><a:accent3><a:srgbClr val="2D5016"/></a:accent3><a:accent4><a:srgbClr val="E8A76B"/></a:accent4><a:accent5><a:srgbClr val="6B7280"/></a:accent5><a:accent6><a:srgbClr val="9CA3AF"/></a:accent6><a:hlink><a:srgbClr val="0F766E"/></a:hlink><a:folHlink><a:srgbClr val="2D5016"/></a:folHlink></a:clrScheme><a:fontScheme name="Habema"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Habema"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`

// CT_SlideMaster sequence: cSld, clrMap, sldLayoutIdLst, hf, timing, transition, extLst
const master = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldMaster ${NS}><p:cSld><p:spTree>${grpSpPr}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId2"/></p:sldLayoutIdLst></p:sldMaster>`

const layout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Kosong"><p:spTree>${grpSpPr}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`

// ---------- relationships parts ----------
const presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${PKG_REL_NS}"></Relationships>`

const slideFiles = []
const SLIDE_COUNT = 12
const addSlide = (xml) => { slideFiles.push(xml) }

function rels(inner) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${PKG_REL_NS}">${inner}</Relationships>`
}

// ---------- slide helpers ----------
const PRIMARY = '0F766E', PRIMARY_D = '2D5016', GOLD = 'F97316', INK = '1F2937', MUTED = '6B7280', WHITE = 'FFFFFF'

function headerBand(x, y, w, title, sub) {
  const s = []
  s.push(rect(x, y, w, 1.18, PRIMARY))
  s.push(rect(x, y + 1.18, w, 0.06, GOLD))
  s.push(textBox(x + 0.55, y + 0.22, w - 1.1, 0.85, [par({ t: title, sz: 4600, b: 1, color: WHITE })], 'ctr'))
  if (sub) s.push(textBox(x + 0.55, y + 0.9, w - 1.1, 0.3, [par({ t: sub, sz: 1600, b: 0, color: 'DDE7DF' })], 'ctr'))
  return s.join('')
}
function footer(num) {
  return textBox(0.55, 7.1, 9, 0.35, [par({ t: 'Habema — Transisi Transaksi Rental & Toko ke Digital', sz: 1200, color: MUTED })], 'ctr')
    + textBox(11.6, 7.1, 1.2, 0.35, [par({ t: String(num), sz: 1200, color: MUTED })], 'ctr')
}

function bodySlide(num, title, sub, items, ref) {
  let b = headerBand(0, 0, W / 914400, title, sub)
  // semua paragraf harus di dalam satu textbox — <a:p> tidak boleh langsung di spTree
  b += textBox(0.55, 1.55, W / 914400 - 1.1, 4.9, items)
  if (ref) b += textBox(0.55, 6.55, 12.2, 0.5, [par({ t: 'Referensi: ' + ref, sz: 1400, color: MUTED })], 'ctr')
  b += footer(num)
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld ${NS}><p:cSld><p:spTree>${grpSpPr}${b}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
}

// slide 1 — judul
const W_IN = W / 914400, H_IN = H / 914400
addSlide(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld ${NS}><p:cSld><p:spTree>${grpSpPr}${rect(0, 0, W_IN, H_IN, PRIMARY)}${rect(0, 3.3, W_IN, 0.07, GOLD)}${textBox(1, 1.2, 11.3, 1.4, [par({ t: 'Habema', sz: 9600, b: 1, color: WHITE })], 'ctr')}${textBox(1, 2.6, 11.3, 0.9, [par({ t: 'Transisi Transaksi Rental & Toko dari Tradisional ke Digital Melalui Website', sz: 2600, b: 0, color: 'E3F2EA' })], 'ctr')}${textBox(1, 3.7, 11.3, 0.8, [par({ t: 'Otomatisasi promosi via email & WhatsApp · Website sebagai media sosial', sz: 2000, b: 0, color: WHITE })], 'ctr')}${textBox(1, 5.2, 11.3, 1, [par({ t: 'Presentasi untuk Habema', sz: 1800, b: 1, color: WHITE }), par({ t: '15 November 2026', sz: 1600, color: 'C9E4D5' })], 'ctr')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`)

addSlide(bodySlide(2, 'Latar belakang: tradisional vs digital', null, [
  { t: 'Tradisional', sz: 2200, b: 1, color: PRIMARY_D },
  { t: 'Jadwal sewa di catatan kertas, konfirmasi WA manual', sz: 1700, bullet: 1 },
  { t: 'Antrian dan pembayaran di toko fisik, tunai atau transfer manual', sz: 1700, bullet: 1 },
  { t: 'Promosi satu arah (brosur, mulut ke mulut), tidak terukur', sz: 1700, bullet: 1 },
  { t: 'Tidak ada jejak digital transaksi pelanggan', sz: 1700, bullet: 1 },
  { t: 'Digital via website', sz: 2200, b: 1, color: PRIMARY_D, marL: 6350 },
  { t: 'Pemilihan jadwal dan cabang secara online, identitas digital', sz: 1700, bullet: 1, marL: 6350 },
  { t: 'Toko tanpa antrian, transaksi 24/7 via Midtrans', sz: 1700, bullet: 1, marL: 6350 },
  { t: 'Promosi terukur: voucher, notifikasi, analitik', sz: 1700, bullet: 1, marL: 6350 },
  { t: 'Setiap transaksi tercatat terstruktur di database', sz: 1700, bullet: 1, marL: 6350 },
], 'app/booking/page.tsx · app/checkout/page.tsx'))

addSlide(bodySlide(3, 'Transaksi rental digital: 5 langkah', 'app/booking/page.tsx · lib/store.ts · lib/booking-utils.ts', [
  { t: '1. Jadwal Sewa', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Pilih tanggal sewa & kembali, cabang pengambilan', sz: 1600, bullet: 1 },
  { t: '2. Verifikasi Identitas', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'KTP/NIK, nama, telepon, alamat disimpan di keranjang', sz: 1600, bullet: 1 },
  { t: '3. Metode Pembayaran', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'WA Konfirmasi, Transfer Bank, atau QRIS manual', sz: 1600, bullet: 1 },
  { t: '4. Syarat & Ketentuan', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Checklist disetujui, disimpan di localStorage', sz: 1600, bullet: 1 },
  { t: '5. Bayar', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'QRIS dengan bukti upload, atau Midtrans Snap', sz: 1600, bullet: 1 },
  { t: 'Hitungan: harga × hari, kupon diskon, deposit 20%', sz: 1700, b: 1, color: GOLD },
], null))

addSlide(bodySlide(4, 'Transaksi toko digital', 'app/checkout/page.tsx · lib/store.ts', [
  { t: 'Keranjang', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Item disimpan di browser (Zustand, kunci habema-cart-storage)', sz: 1600, bullet: 1 },
  { t: 'Alamat', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Cascading provinsi, kabupaten, kecamatan, desa', sz: 1600, bullet: 1 },
  { t: 'Ongkir', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Dihitung dari berat barang (ShippingSelector)', sz: 1600, bullet: 1 },
  { t: 'Pembayaran', sz: 1900, b: 1, color: PRIMARY_D },
  { t: '15 metode: VA, e-wallet, retail, tunai saat terima (COD)', sz: 1600, bullet: 1 },
  { t: 'Midtrans Snap untuk pembayaran online langsung', sz: 1600, bullet: 1 },
], null))

addSlide(bodySlide(5, 'Pembayaran digital & webhook otomatis', 'lib/midtrans.ts · app/api/midtrans/create-transaction/route.ts · app/api/midtrans/webhook/route.ts', [
  { t: 'Midtrans Snap', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Skrip sandbox atau produksi (NEXT_PUBLIC_MIDTRANS_PRODUCTION)', sz: 1600, bullet: 1 },
  { t: 'Order ID & jumlah total dihitung ulang di server', sz: 1600, bullet: 1 },
  { t: 'Webhook server-to-server: status berubah otomatis', sz: 1600, bullet: 1 },
  { t: 'capture/settlement menghasilkan paid & confirmed', sz: 1600, bullet: 1 },
  { t: 'pending / deny / cancel / expire / refund ditangani', sz: 1600, bullet: 1 },
  { t: 'Idempoten: notifikasi duplikat diproses sekali', sz: 1600, bullet: 1 },
  { t: 'Stok rental_count & shop_orders terupdate saat sukses', sz: 1600, bullet: 1 },
], null))

addSlide(bodySlide(6, 'Siklus status transaksi', 'lib/store.ts (Order.status) · app/api/midtrans/webhook/route.ts', [
  { t: 'pending, confirmed, ready, picked-up, returned, completed', sz: 2000, b: 1, color: PRIMARY_D },
  { t: 'Setiap pesanan punya status tercatat dan riwayat', sz: 1600, bullet: 1 },
  { t: 'Stok otomatis: rental_count per alat', sz: 1600, bullet: 1 },
  { t: 'stock shop_orders terkurangi saat pembayaran sukses', sz: 1600, bullet: 1 },
  { t: 'Status tidak pernah menurun (final: paid/refunded dilindungi)', sz: 1600, bullet: 1 },
], null))

addSlide(bodySlide(7, 'Otomatisasi promosi via email & WhatsApp', 'lib/store.ts (ClaimedDiscount) · lib/manual-payment.ts', [
  { t: 'Voucher', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Klaim diskon via POST /api/discounts/claim, masuk ke keranjang', sz: 1600, bullet: 1 },
  { t: 'Notifikasi admin', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Baca & tandai dibaca via app/api/admin/notifications', sz: 1600, bullet: 1 },
  { t: 'WA Konfirmasi', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Link wa.me, nomor diformat 62xxx, pesanan disimpan lokal', sz: 1600, bullet: 1 },
  { t: 'Roadmap (belum ada kode): blast email & WA otomatis', sz: 1600, bullet: 1 },
  { t: 'Pengingat pembayaran & konfirmasi keberangkatan', sz: 1600, bullet: 1 },
], null))

addSlide(bodySlide(8, 'Website sebagai media sosial', 'app/layout.tsx · components/home/ · app/api/home/', [
  { t: 'SEO ~60 kata kunci + Open Graph & Twitter card', sz: 1700, bullet: 1 },
  { t: 'Halaman depan sebagai iklan: hero, banner promo, voucher', sz: 1700, bullet: 1 },
  { t: 'Produk & paket unggulan di halaman muka', sz: 1700, bullet: 1 },
  { t: 'Bukti sosial: logo cloud mitra, "2.000+ petualang"', sz: 1700, bullet: 1 },
  { t: 'Tombol WhatsApp & telepon dari data cabang', sz: 1700, bullet: 1 },
  { t: 'Masuk dengan Google OAuth, analitik Vercel & GTM', sz: 1700, bullet: 1 },
], null))

addSlide(bodySlide(9, 'Admin vs publik', 'components/layout-wrapper.tsx · app/api/admin/*', [
  { t: 'Publik', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Header + Footer, halaman sewa, toko, pembayaran', sz: 1600, bullet: 1 },
  { t: 'Admin (/admin/*)', sz: 1900, b: 1, color: PRIMARY_D },
  { t: 'Tanpa Header/Footer, hanya vendor yang diakses', sz: 1600, bullet: 1 },
  { t: 'Kelola produk, kategori, pesanan, banner promo', sz: 1600, bullet: 1 },
], null))

addSlide(bodySlide(10, 'Manfaat digitalisasi', null, [
  { t: 'Transaksi 24/7, tidak terbuka jam toko', sz: 1800, bullet: 1 },
  { t: 'Catatan digital lengkap: pesanan, pembayaran, identitas, bukti', sz: 1800, bullet: 1 },
  { t: 'Stok otomatis terupdate saat transaksi sukses', sz: 1800, bullet: 1 },
  { t: 'Promosi terukur: klaim voucher & notifikasi', sz: 1800, bullet: 1 },
  { t: 'Jangkauan lebih luas melalui media sosial & SEO', sz: 1800, bullet: 1 },
], null))

addSlide(bodySlide(11, 'Roadmap', null, [
  { t: 'Blast email & WhatsApp otomatis ke pelanggan (target; belum ada kode)', sz: 1800, bullet: 1 },
  { t: 'Integrasi media sosial: share pesanan & ulasan pelanggan', sz: 1800, bullet: 1 },
  { t: 'Pelatihan admin & cabang', sz: 1800, bullet: 1 },
  { t: 'Midtrans ke mode produksi dengan kredensi resmi', sz: 1800, bullet: 1 },
], null))

// slide 12 — penutup
addSlide(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld ${NS}><p:cSld><p:spTree>${grpSpPr}${rect(0, 0, W_IN, H_IN, PRIMARY)}${rect(0, 3.3, W_IN, 0.07, GOLD)}${textBox(1, 1.4, 11.3, 1.2, [par({ t: 'Penutup & Q&A', sz: 8000, b: 1, color: WHITE })], 'ctr')}${textBox(1, 2.9, 11.3, 1, [par({ t: '"Digitalisasi transaksi = jangkauan lebih luas, catatan lebih rapi, promosi yang terukur."', sz: 2400, b: 0, color: 'E3F2EA' })], 'ctr')}${textBox(1, 4.2, 11.3, 0.8, [par({ t: 'Terima kasih — pertanyaan?', sz: 2200, b: 1, color: WHITE })], 'ctr')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`)

// ---------- package ----------
const pres = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation ${NS}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster"/></p:sldMasterIdLst><p:sldIdLst>${slideFiles.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${W}" cy="${H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`

const presentationRelsInner =
  `<Relationship Id="rIdMaster" Type="${MASTER_R}" Target="slideMasters/slideMaster1.xml"/>` +
  slideFiles.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${SLIDE_R}" Target="slides/slide${i + 1}.xml"/>`).join('')

const masterRelsInner =
  `<Relationship Id="rId1" Type="${THEME_R}" Target="../theme/theme1.xml"/>` +
  `<Relationship Id="rId2" Type="${LAYOUT_R}" Target="../slideLayouts/slideLayout1.xml"/>`

const layoutRelsInner =
  `<Relationship Id="rId1" Type="${MASTER_R}" Target="../slideMasters/slideMaster1.xml"/>`

const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideFiles.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${PKG_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`

const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Habema: Transisi Transaksi Rental dan Toko ke Digital</dc:title><dc:creator>Habema</dc:creator><cp:lastModifiedBy>Habema</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-11-15T10:30:00Z</dcterms:created></cp:coreProperties>`

const files = [
  { name: '[Content_Types].xml', data: ct },
  { name: '_rels/.rels', data: rootRels },
  { name: 'ppt/presentation.xml', data: pres },
  { name: 'ppt/_rels/presentation.xml.rels', data: rels(presentationRelsInner) },
  { name: 'ppt/slideMasters/slideMaster1.xml', data: master },
  { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: rels(masterRelsInner) },
  { name: 'ppt/slideLayouts/slideLayout1.xml', data: layout },
  { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: rels(layoutRelsInner) },
  { name: 'ppt/theme/theme1.xml', data: theme },
  ...slideFiles.flatMap((s, i) => ([
    { name: `ppt/slides/slide${i + 1}.xml`, data: s },
    { name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: rels(`<Relationship Id="rId1" Type="${LAYOUT_R}" Target="../slideLayouts/slideLayout1.xml"/>`) },
  ])),
  { name: 'docProps/core.xml', data: core },
]

writeFileSync(OUT, zip(files))
console.log('OK', OUT, slideFiles.length, 'slides')