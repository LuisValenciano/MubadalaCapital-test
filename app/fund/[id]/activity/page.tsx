import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFundById, mcIVCapitalActivity, mcIVPartnerCapitalEvolution, weeklyCapitalActivity, weeklyPartnerCapitalEvolution } from '@/lib/mock-data'
import CapitalActivityChart from '@/components/charts/CapitalActivityChart'
import PartnerCapitalChart from '@/components/charts/PartnerCapitalChart'

function generateCapitalActivity(fund: { fundSize: number; totalCalled: number; distributed: number }) {
  const unused = fund.fundSize - fund.totalCalled
  return {
    commitment: fund.fundSize,
    contributions: fund.totalCalled,
    distributions: fund.distributed,
    unused,
    pctContributed: (fund.totalCalled / fund.fundSize) * 100,
    pctReturned: fund.totalCalled > 0 ? (fund.distributed / fund.totalCalled) * 100 : 0,
  }
}

function generatePartnerCapital(fund: { adjustedNAV: number; totalCalled: number; distributed: number }) {
  const base = fund.adjustedNAV
  return [
    { quarter: '2Q25', openingNAV: Math.round(base * 0.88), calls: Math.round(fund.totalCalled * 0.06), distributions: -Math.round(fund.distributed * 0.3), pnl: Math.round(base * 0.04), closingNAV: Math.round(base * 0.94) },
    { quarter: '3Q25', openingNAV: Math.round(base * 0.94), calls: Math.round(fund.totalCalled * 0.03), distributions: -Math.round(fund.distributed * 0.4), pnl: Math.round(base * 0.03), closingNAV: Math.round(base * 0.97) },
    { quarter: '4Q25', openingNAV: Math.round(base * 0.97), calls: Math.round(fund.totalCalled * 0.01), distributions: -Math.round(fund.distributed * 0.3), pnl: -Math.round(base * 0.02), closingNAV: base },
  ]
}

export default function FundActivityPage({ params }: { params: { id: string } }) {
  const fund = getFundById(params.id)
  if (!fund) return notFound()

  const capActivity =
    params.id === 'mc-iv'
      ? mcIVCapitalActivity
      : params.id === 'mdc-ii' || params.id === 'mic-iii'
      ? weeklyCapitalActivity
      : generateCapitalActivity(fund)

  const partnerData =
    params.id === 'mc-iv'
      ? mcIVPartnerCapitalEvolution
      : params.id === 'mdc-ii' || params.id === 'mic-iii'
      ? weeklyPartnerCapitalEvolution
      : generatePartnerCapital(fund)

  const tabs = [
    { label: 'Overview', href: `/fund/${fund.id}`, active: false },
    { label: 'Fund Activity', href: `/fund/${fund.id}/activity`, active: true },
    { label: 'Schedule of Investments', href: `/fund/${fund.id}/schedule`, active: false },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#90cac5]">
        <Link href="/" className="hover:text-[#4DB6AC] transition-colors">All Funds</Link>
        <span>/</span>
        <Link href={`/fund/${fund.id}`} className="hover:text-[#4DB6AC] transition-colors">{fund.name}</Link>
        <span>/</span>
        <span className="text-[#4DB6AC] font-semibold">Fund Activity</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{fund.name} — Fund Activity</h1>
            <span className="badge-teal">{fund.group}</span>
          </div>
          <p className="text-sm text-[#90cac5] mt-1">YTD & Expected · As of 31 December 2025</p>
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

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Capital Activity */}
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-5">
          <p className="text-sm font-semibold text-white mb-1">Capital Activity (YTD & Expected)</p>
          <p className="text-xs text-[#90cac5] mb-4">USD millions</p>
          <CapitalActivityChart data={capActivity} />
        </div>

        {/* Partner Capital Evolution */}
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-5">
          <p className="text-sm font-semibold text-white mb-1">Partner's Capital Evolution QTD</p>
          <p className="text-xs text-[#90cac5] mb-4">USD millions · Quarterly waterfall</p>
          <PartnerCapitalChart data={partnerData} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5]">Commitment</p>
          <p className="text-xl font-bold text-white mt-1">${capActivity.commitment.toLocaleString()}M</p>
        </div>
        <div className="kpi-card">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5]">Contributions</p>
          <p className="text-xl font-bold text-[#4DB6AC] mt-1">${capActivity.contributions.toLocaleString()}M</p>
          <p className="text-xs text-[#90cac5] mt-0.5">{capActivity.pctContributed.toFixed(1)}% contributed</p>
        </div>
        <div className="kpi-card">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5]">Distributions</p>
          <p className="text-xl font-bold text-[#00897B] mt-1">${capActivity.distributions.toLocaleString()}M</p>
          <p className="text-xs text-[#90cac5] mt-0.5">{capActivity.pctReturned.toFixed(1)}% returned</p>
        </div>
        <div className="kpi-card">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5]">Unused Commitment</p>
          <p className="text-xl font-bold text-white mt-1">${capActivity.unused.toLocaleString()}M</p>
          <p className="text-xs text-[#90cac5] mt-0.5">
            {((capActivity.unused / capActivity.commitment) * 100).toFixed(1)}% undeployed
          </p>
        </div>
      </div>

      {/* Quarter Table */}
      <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1e3535]">
          <p className="text-sm font-semibold text-white">Quarterly Capital Bridge (USD M)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="table-teal-header">
                <th className="text-left">Quarter</th>
                <th className="text-right">Opening NAV</th>
                <th className="text-right">Calls</th>
                <th className="text-right">Distributions</th>
                <th className="text-right">P&amp;L</th>
                <th className="text-right">Closing NAV</th>
              </tr>
            </thead>
            <tbody>
              {partnerData.map((row, i) => (
                <tr key={row.quarter} className={`table-row-base ${i % 2 === 1 ? 'row-alt' : ''}`}>
                  <td className="font-semibold text-[#4DB6AC]">{row.quarter}</td>
                  <td className="text-right">{row.openingNAV.toLocaleString()}</td>
                  <td className="text-right text-[#4DB6AC]">+{row.calls}</td>
                  <td className="text-right text-[#f87171]">{row.distributions}</td>
                  <td className={`text-right font-semibold ${row.pnl >= 0 ? 'text-[#4DB6AC]' : 'text-[#f87171]'}`}>
                    {row.pnl >= 0 ? '+' : ''}{row.pnl}
                  </td>
                  <td className="text-right font-bold text-white">{row.closingNAV.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
