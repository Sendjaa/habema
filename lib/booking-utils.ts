export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

export function getMonthName(date: Date): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  return months[date.getMonth()]
}

export function getDayName(date: Date): string {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return days[date.getDay()]
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function calculateRentalPrice(
  dailyPrice: number,
  days: number,
  discountPercent = 0
): number {
  const subtotal = dailyPrice * days
  const discount = (subtotal * discountPercent) / 100
  return subtotal - discount
}

export function calculateOvertime(
  returnDate: Date,
  expectedReturnDate: Date,
  dailyPrice: number
): number {
  const days = calculateDaysBetween(expectedReturnDate, returnDate)
  if (days <= 0) return 0
  // Overtime charge is 1.5x the daily rate
  return Math.ceil(dailyPrice * 1.5 * days)
}

export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  return date >= startDate && date <= endDate
}

export function getNextAvailableDate(unavailableRanges: Array<{ start: Date; end: Date }>): Date {
  if (unavailableRanges.length === 0) return new Date()

  // Sort by start date
  const sorted = [...unavailableRanges].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  )

  // Find first gap or return after last range
  let currentDate = new Date()
  for (const range of sorted) {
    if (currentDate < range.start) return currentDate
    currentDate = new Date(Math.max(currentDate.getTime(), range.end.getTime()))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return currentDate
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
