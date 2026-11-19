'use client'

import { useState } from 'react'

export type ContactBranch = {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  operationalHours: string | null
  mapUrl: string | null
}

const topics = [
  'Sewa alat',
  'Beli perlengkapan',
  'Open trip',
  'Kerja sama',
  'Lainnya',
]

function displayBranchName(name: string): string {
  return name.replace(/\s*\(cabang\s*\d+\)\s*$/i, '').trim()
}

function waNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  return `62${digits}`
}

function buildMessage(name: string, branch: ContactBranch, topic: string, message: string) {
  return [
    `Halo Habema, saya ${name.trim()}.`,
    `Lokasi: ${displayBranchName(branch.name)}.`,
    `Topik: ${topic}.`,
    '',
    message.trim(),
  ].join('\n')
}

export default function ContactForm({ branches }: { branches: ContactBranch[] }) {
  const [name, setName] = useState('')
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'opened' | 'error'>('idle')

  const selectedBranch = branches.find((branch) => branch.id === branchId) ?? null
  const waLink =
    selectedBranch?.phone && topic
      ? `https://wa.me/${waNumber(selectedBranch.phone)}?text=${encodeURIComponent(
          buildMessage(name, selectedBranch, topic, message),
        )}`
      : null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!waLink) {
      setStatus('error')
      return
    }

    window.open(waLink, '_blank', 'noopener,noreferrer')
    setStatus('opened')
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
      <div className="max-w-xl">
        <h2 className="text-lg font-bold text-stone-900 md:text-xl">Tulis kebutuhan Anda</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Sertakan tanggal, jumlah peserta, dan alat yang dicari agar tim bisa mengecek
          ketersediaan. Semua kolom wajib diisi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Nama lengkap
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama Anda"
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-500 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label htmlFor="contact-branch" className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Lokasi
            </label>
            <select
              id="contact-branch"
              name="branch"
              required
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {displayBranchName(branch.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Topik
          </label>
          <select
            id="contact-topic"
            name="topic"
            required
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
          >
            <option value="">Pilih topik</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Pesan
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Contoh: Saya ingin sewa 2 tenda dan 4 sleeping bag untuk 4 orang pada 24-26 November."
            className="mt-2 w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-500 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-xs leading-relaxed text-stone-600">
            Pesan akan dibuka di WhatsApp. Pesan belum terkirim sebelum Anda menekan tombol
            kirim di aplikasi WhatsApp.
          </p>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-forest px-6 text-sm font-bold text-white transition-colors hover:bg-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          >
            Lanjut ke WhatsApp
          </button>
        </div>
      </form>

      {status === 'opened' && waLink && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-forest/20 bg-forest-soft p-4 text-sm leading-relaxed text-forest"
        >
          WhatsApp dibuka di tab baru. Jika tidak terbuka,{' '}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-forest/30 underline-offset-4 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
          >
            buka tautan WhatsApp
          </a>
          .
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-700"
        >
          Nomor WhatsApp untuk lokasi ini belum tersedia. Pilih lokasi lain atau gunakan kanal
          langsung di samping.
        </div>
      )}
    </div>
  )
}
