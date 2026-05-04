import { Suspense } from 'react'
import FundsTable from '@/components/FundsTable'
import QuarterSelector from '@/components/QuarterSelector'
import { getAllFundsData, getAvailableQuarters } from '@/lib/all-funds-data'

interface PageProps {
  searchParams: { date?: string }
}

export default async function AllFundsPage({ searchParams }: PageProps) {
  const quarters = getAvailableQuarters()
  const { funds, reportingDate } = getAllFundsData(searchParams.date)

  const current = quarters.find((q) => q.date === reportingDate)
  const displayDate = new Date(reportingDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Private Equity Quarterly Report</h1>
          <p className="text-sm text-[#90cac5] mt-0.5">As of {displayDate} · All figures in USD millions</p>
        </div>
        <Suspense fallback={<span className="badge-teal">{current?.label}</span>}>
          <QuarterSelector quarters={quarters} selected={reportingDate} />
        </Suspense>
      </div>

      <FundsTable funds={funds} />
    </div>
  )
}
