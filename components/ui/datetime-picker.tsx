"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { Matcher } from "react-day-picker";
import { CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Pemilih tanggal + jam.
 *
 * KENAPA DIBUAT SENDIRI
 * ---------------------
 * Awalnya hendak memakai `@spectrumui/datetime-picker` dari
 * ui.spectrumhq.in. Registry mereka tidak bisa dipakai: item
 * `datetime-picker-demo` ada, tapi `registryDependencies: ["datetime-picker"]`
 * ditulis tanpa namespace, sehingga shadcn mencarinya di ui.shadcn.com dan
 * gagal. Item `datetime-picker` di registry mereka sendiri tidak ada —
 * https://ui.spectrumhq.in/r/datetime-picker.json membalas halaman HTML 404.
 *
 * API di bawah sengaja dibuat sama dengan yang dipakai contoh mereka:
 *
 *     <DateTimePicker value={date} onChange={setDate} className="w-[280px]"
 *       locale={} weekStartsOn={} showWeekNumber={} showOutsideDays={} />
 *
 * Jadi kalau kelak sumber aslinya didapat (mis. disalin dari tab "code" di
 * halaman docs mereka), berkas ini bisa ditukar langsung tanpa mengubah
 * pemanggilnya.
 *
 * Susunannya memakai komponen yang sudah ada di repo — `Calendar` (yang
 * membungkus react-day-picker 9) dan `Popover` (Radix). Tidak ada dependensi
 * baru. `locale`, `weekStartsOn`, `showWeekNumber`, `showOutsideDays` terus
 * diteruskan ke DayPicker apa adanya.
 */

export interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  /** Locale date-fns. Bawaan: bahasa Indonesia. */
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekNumber?: boolean;
  showOutsideDays?: boolean;
  /** Jarak pilihan menit. Bawaan 30 — presisi menit jarang berarti untuk sewa. */
  minuteStep?: number;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

/** Jam bawaan saat pengguna memilih tanggal lebih dulu. */
const DEFAULT_HOURS = 9;
const DEFAULT_MINUTES = 0;

export function DateTimePicker({
  value,
  onChange,
  className,
  placeholder = "Pilih tanggal & jam",
  locale = localeId,
  weekStartsOn = 1,
  showWeekNumber,
  showOutsideDays,
  minuteStep = 30,
  disabled,
  fromDate,
  toDate,
  id,
  "aria-label": ariaLabel,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Jam disimpan terpisah dari tanggal: memilih tanggal tidak boleh
  // mengembalikan jam ke bawaan, dan sebaliknya.
  const [time, setTime] = React.useState(() => ({
    hours: value?.getHours() ?? DEFAULT_HOURS,
    minutes: value?.getMinutes() ?? DEFAULT_MINUTES,
  }));

  const emit = (date: Date | undefined, nextTime = time) => {
    if (!date) {
      onChange?.(undefined);
      return;
    }
    const combined = new Date(date);
    combined.setHours(nextTime.hours, nextTime.minutes, 0, 0);
    onChange?.(combined);
  };

  const handleTimeChange = (part: "hours" | "minutes", raw: string) => {
    const nextTime = { ...time, [part]: Number(raw) };
    setTime(nextTime);
    // Tanggal sudah dipilih sebelumnya → perbarui nilainya seketika. Kalau
    // belum ada tanggal, jam saja tidak cukup untuk membentuk Date yang sah.
    if (value) emit(value, nextTime);
  };

  const minutes = React.useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep]
  );

  const disabledDays = React.useMemo<Matcher[]>(
    () => [
      ...(fromDate ? [{ before: fromDate }] : []),
      ...(toDate ? [{ after: toDate }] : []),
    ],
    [fromDate, toDate]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="shrink-0" />
          {value ? (
            format(value, "d MMM yyyy, HH:mm", { locale })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(day) => emit(day)}
          defaultMonth={value}
          locale={locale}
          weekStartsOn={weekStartsOn}
          showWeekNumber={showWeekNumber}
          showOutsideDays={showOutsideDays}
          disabled={disabledDays}
        />

        <div className="flex items-center gap-2 border-t px-3 py-2.5">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <label className="sr-only" htmlFor={id ? `${id}-hours` : undefined}>
            Jam
          </label>
          <select
            id={id ? `${id}-hours` : undefined}
            value={time.hours}
            onChange={(e) => handleTimeChange("hours", e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm tabular-nums focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>

          <span className="text-muted-foreground">:</span>

          <label className="sr-only" htmlFor={id ? `${id}-minutes` : undefined}>
            Menit
          </label>
          <select
            id={id ? `${id}-minutes` : undefined}
            value={time.minutes}
            onChange={(e) => handleTimeChange("minutes", e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm tabular-nums focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {minutes.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-1.5">
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange?.(undefined);
                  setTime({ hours: DEFAULT_HOURS, minutes: DEFAULT_MINUTES });
                }}
              >
                Hapus
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Selesai
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
