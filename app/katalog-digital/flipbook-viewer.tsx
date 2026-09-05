"use client";

import { useRef, useState } from "react";
import { Maximize, ExternalLink, BookOpen } from "lucide-react";

export const FLIPBOOK_URL = "https://heyzine.com/flip-book/7b44f5e903.html";

export function FlipbookViewer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  const openFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => null);
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          Buku Katalog Interaktif
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFullscreen}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold text-slate-600 bg-white border border-stone-200 hover:border-stone-300 transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
            Fullscreen
          </button>
          <a
            href={FLIPBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold text-slate-600 bg-white border border-stone-200 hover:border-stone-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Tab Baru
          </a>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-xl ring-1 ring-stone-200 bg-white shadow-sm aspect-[4/3] md:aspect-[16/10]"
      >
        {!failed ? (
          <iframe
            src={FLIPBOOK_URL}
            title="Katalog Digital Habema Outdoor"
            loading="lazy"
            allowFullScreen
            allow="fullscreen; clipboard-write"
            onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-stone-50">
            <BookOpen className="w-10 h-10 text-stone-300" />
            <p className="text-sm text-stone-500 font-medium max-w-sm">
              Katalog tidak dapat dimuat di sini (kemungkinan diblokir
              browser/ad-block).
            </p>
            <a
              href={FLIPBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Katalog di Tab Baru
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
