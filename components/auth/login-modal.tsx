'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export function LoginModal({
  open,
  onOpenChange,
  redirectTo = '/',
}: LoginModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0">
        <DialogTitle className="sr-only">Login / Daftar Habema Outdoor</DialogTitle>
        <div className="relative w-full aspect-2/1 overflow-hidden">
          <Image
            src="/images/hook-registered.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        <div className="px-6 py-6 bg-white text-center">
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
            }}
            className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-colors"
          >
            Masuk / Daftar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-stone-400 mt-3">
            Dengan mendaftar, kamu mendapatkan akses ke fitur eksklusif dan penawaran spesial.
          </p>

          <div className="mt-4 pt-4 border-t border-stone-100">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors"
            >
              Lanjutkan sebagai tamu
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
