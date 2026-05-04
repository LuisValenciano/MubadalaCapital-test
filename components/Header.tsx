'use client'
import { useState, useRef } from 'react'

export default function Header() {
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD')
  const [date, setDate] = useState('2025-12-31')
  const dateInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="h-14 bg-[#0d2626] border-b border-[#1e3535] flex items-center px-6 gap-4 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#4DB6AC] flex items-center justify-center flex-shrink-0">
          <span className="text-[#0d2626] font-black text-xs">M</span>
        </div>
        <span className="text-white font-bold text-sm tracking-wide uppercase hidden md:block">
          MUBADALA CAPITAL
        </span>
      </div>

      <div className="flex-1" />

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Date Picker */}
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="flex items-center gap-2 bg-[#1e3535] rounded-md px-3 py-1.5 border border-[#2d5555] hover:border-[#4DB6AC] transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-[#4DB6AC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[#e2f0ef] text-xs font-medium">{date}</span>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
            tabIndex={-1}
          />
        </button>

        {/* Currency Toggle */}
        <div className="flex items-center bg-[#1e3535] rounded-md border border-[#2d5555] overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 transition-colors ${
              currency === 'USD'
                ? 'bg-[#4DB6AC] text-[#0d2626]'
                : 'text-[#90cac5] hover:text-white'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setCurrency('BRL')}
            className={`px-3 py-1.5 transition-colors ${
              currency === 'BRL'
                ? 'bg-[#4DB6AC] text-[#0d2626]'
                : 'text-[#90cac5] hover:text-white'
            }`}
          >
            BRL
          </button>
        </div>

        {/* User */}
        <div className="w-7 h-7 rounded-full bg-[#2d5555] flex items-center justify-center">
          <span className="text-[#4DB6AC] text-xs font-bold">IR</span>
        </div>
      </div>
    </header>
  )
}
