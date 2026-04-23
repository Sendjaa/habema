'use client'

import { useState } from 'react'
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, calculateDaysBetween } from '@/lib/booking-utils'
// import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Badge } from '../ui/badge'

export function DateRangePicker({ onDateRangeSelect, minDate = new Date(new Date().setHours(0,0,0,0)), selectedStartDate, selectedEndDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tempStart, setTempStart] = useState<Date | null>(selectedStartDate || null)
  const [tempEnd, setTempEnd] = useState<Date | null>(selectedEndDate || null)

  const handleDateClick = (day: number) => {
    const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 0, 0, 0, 0)
    if (clicked < minDate) return

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clicked); setTempEnd(null);
    } else if (clicked < tempStart) {
      setTempEnd(tempStart); setTempStart(clicked);
      onDateRangeSelect(clicked, tempStart)
    } else if (clicked.getTime() !== tempStart.getTime()) {
      setTempEnd(clicked);
      onDateRangeSelect(tempStart, clicked)
    }
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month - 1))} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-800 text-sm">{getMonthName(currentMonth)} {year}</span>
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month + 1))} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
            <span 
              key={`header-day-${index}-${d}`} 
              className="text-center text-[10px] font-bold text-slate-400 py-2"
            >
              {d}
            </span>
          ))}
          
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-cell-${year}-${month}-${i}`} />
            
            const d = new Date(year, month, day, 0, 0, 0, 0)
            const isSel = (tempStart && d.getTime() === tempStart.getTime()) || (tempEnd && d.getTime() === tempEnd.getTime())
            const inRange = tempStart && tempEnd && d > tempStart && d < tempEnd
            const uniqueKey = `date-${year}-${month}-${day}`
            
            return (
              <button 
                key={uniqueKey} 
                type="button"
                onClick={() => handleDateClick(day)} 
                disabled={d < minDate} 
                className={`h-10 text-xs font-bold rounded-lg transition-all 
                  ${d < minDate ? 'text-slate-200 cursor-not-allowed' : 
                    isSel ? 'bg-slate-900 text-white shadow-sm' : 
                    inRange ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 max-w-sm mx-auto">
      {renderCalendar()}
      {tempStart && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Mulai</p>
              <p className="text-xs font-bold text-slate-800">{tempStart.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Selesai</p>
              <p className="text-xs font-bold text-slate-800">{tempEnd ? tempEnd.toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}</p>
            </div>
          </div>
          {tempEnd && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 border-none rounded-lg font-bold">
              {calculateDaysBetween(tempStart, tempEnd)} Hari
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}