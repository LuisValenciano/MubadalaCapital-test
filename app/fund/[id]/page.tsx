import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFundById, mcIVQuarterlyPerformance, weeklyQuarterlyPerformance } from '@/lib/mock-data'
import KPICard from '@/components/KPICard'
import InvestmentChart from '@/components/charts/InvestmentChart'

// Generate fallback quarterly data for non-MC IV funds
function generateQuarterlyData(fund: { totalCalled: number; adjustedNAV: number; distributed: number }) {
  const steps = 5
  const calledPerStep = fund.totalCalled / steps
  const navBase = fund.adjustedNAV / steps
  const realizedPerStep = fund.distributed / steps

  return Array.from({ length: steps }, (_, i) => ({
    quarter: `Q${((i % 4) * 2 + 2).toString().padStart(1)} ${20 + Math.floor(i / 2)}`,
    investedCapital: Math.round(calledPerStep * (i + 1)),
    nav: Math.round(navBase * (i + 1) * (1 + i * 0.04)),
    realized: Math.round(realizedPerStep * Math.max(0, i - 1)),
  }))
}

export default function FundDetailPage({ params }: { params: { id: string } }) {
  const fund = getFundById(params.id)
  if (!fund) return notFound()

  const chartData =
    params.id === 'mc-iv'
      ? mcIVQuarterlyPerformance
      : params.id === 'mdc-ii' || params.id === 'mic-iii'
      ? weeklyQuarterlyPerformance
      : generateQuarterlyData(fund)

  const tabs = [
    { label: 'Overview', href: `/fund/${fund.id}`, active: true },
    { label: 'Fund Activity', href: `/fund/${fund.id}/activity`, active: false },
    { label: 'Schedule of Investments', href: `/fund/${fund.id}/schedule`, active: false },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#90cac5]">
        <Link href="/" className="hover:text-[#4DB6AC] transition-colors">All Funds</Link>
        <span>/</span>
        <span className="text-[#4DB6AC] font-semibold">{fund.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{fund.name}</h1>
            <span className="badge-teal">{fund.group}</span>
            <span className="badge-teal">Vintage {fund.vintage}</span>
          </div>
          <p className="text-sm text-[#90cac5] mt-1">
            As of 31 December 2025 · Fund Size: USD {fund.fundSize.toLocaleString()}M
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab.active
                  ? 'bg-[#4DB6AC] text-[#0d2626]'
                  : 'bg-[#1e3535] text-[#90cac5] hover:bg-[#243f3f] hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-5">
        <p className="text-sm text-[#c5e0de] leading-relaxed">{fund.description}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Gross MOIC" value={`${fund.grossMOIC.toFixed(2)}x`} sub="Gross multiple" accent />
        <KPICard label="Net MOIC" value={`${fund.netMOIC.toFixed(2)}x`} sub="Net multiple" />
        <KPICard label="Gross DPI" value={`${fund.grossDPI.toFixed(2)}x`} sub="Distributions / paid-in" />
        <KPICard label="Net DPI" value={`${fund.netDPI.toFixed(2)}x`} sub="Net distributions" />
        <KPICard label="Gross IRR" value={`${fund.grossIRR.toFixed(1)}%`} sub="Gross return rate" accent />
        <KPICard label="Net IRR" value={`${fund.netIRR.toFixed(1)}%`} sub="Net return rate" />
      </div>

      {/* Chart + Stat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-[#0d2626] rounded-xl border border-[#1e3535] p-5">
          <p className="text-sm font-semibold text-white mb-4">
            Invested Capital vs Total Value (USD M)
          </p>
          <InvestmentChart data={chartData} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="kpi-card flex-1 flex flex-col justify-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5] mb-2">
              Unrealized Investments
            </p>
            <p className="text-4xl font-black text-white">{fund.numUnrealizedInvestments}</p>
            <p className="text-xs text-[#4DB6AC] mt-1">Active portfolio companies</p>
          </div>
          <div className="kpi-card flex-1 flex flex-col justify-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5] mb-2">
              Total Called
            </p>
            <p className="text-2xl font-bold text-white">
              ${fund.totalCalled.toLocaleString()}M
            </p>
            <p className="text-xs text-[#4DB6AC] mt-1">
              {((fund.totalCalled / fund.fundSize) * 100).toFixed(1)}% of fund size
            </p>
          </div>
          <div className="kpi-card flex-1 flex flex-col justify-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5] mb-2">
              Adjusted NAV
            </p>
            <p className="text-2xl font-bold text-white">
              ${fund.adjustedNAV.toLocaleString()}M
            </p>
            <p className="text-xs text-[#00897B] mt-1">Unrealized value</p>
          </div>
        </div>
      </div>

      {/* Quick nav to sub-pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/fund/${fund.id}/activity`}
          className="bg-[#0d2626] border border-[#1e3535] hover:border-[#4DB6AC] rounded-xl p-5 group transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#4DB6AC] transition-colors">
                Fund Activity
              </p>
              <p className="text-xs text-[#90cac5] mt-1">
                Capital calls, distributions, partner evolution
              </p>
            </div>
            <svg className="w-5 h-5 text-[#4DB6AC] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        <Link
          href={`/fund/${fund.id}/schedule`}
          className="bg-[#0d2626] border border-[#1e3535] hover:border-[#4DB6AC] rounded-xl p-5 group transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#4DB6AC] transition-colors">
                Schedule of Investments
              </p>
              <p className="text-xs text-[#90cac5] mt-1">
                Portfolio company breakdown and valuations
              </p>
            </div>
            <svg className="w-5 h-5 text-[#4DB6AC] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  )
}
