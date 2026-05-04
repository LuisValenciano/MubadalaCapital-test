import FundsTable from '@/components/FundsTable'

export default function AllFundsPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Private Equity Quarterly Report</h1>
          <p className="text-sm text-[#90cac5] mt-0.5">As of 31 December 2025 · All figures in USD millions</p>
        </div>
        <span className="badge-teal">Q4 2025</span>
      </div>

      <FundsTable />
    </div>
  )
}
