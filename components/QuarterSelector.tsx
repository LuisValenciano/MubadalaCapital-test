'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Quarter } from '@/lib/all-funds-data'

interface QuarterSelectorProps {
  quarters: Quarter[]
  selected: string
}

export default function QuarterSelector({ quarters, selected }: QuarterSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(date: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', date)
    router.push(`?${params.toString()}`)
  }

  const current = quarters.find((q) => q.date === selected)

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-[#1e3535] text-white text-sm font-semibold px-3 py-1.5 pr-8 rounded-md border border-[#2d5555] hover:border-[#4DB6AC] focus:outline-none focus:border-[#4DB6AC] cursor-pointer transition-colors"
      >
        {quarters.map((q) => (
          <option key={q.date} value={q.date} className="bg-[#0d2626]">
            {q.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#4DB6AC] text-xs">▾</span>
    </div>
  )
}
