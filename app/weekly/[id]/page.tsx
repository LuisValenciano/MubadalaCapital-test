import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getFundById,
  weeklySchedule,
  weeklyCapitalActivity,
  weeklyPartnerCapitalEvolution,
  weeklyQuarterlyPerformance,
  mcIVCapitalActivity,
  mcIVPartnerCapitalEvolution,
  mcIVQuarterlyPerformance,
  mcIVInvestments,
} from '@/lib/mock-data'
import CapitalActivityChart from '@/components/charts/CapitalActivityChart'
import PartnerCapitalChart from '@/components/charts/PartnerCapitalChart'
import InvestmentChart from '@/components/charts/InvestmentChart'

const fmt = (n: number) => (n === 0 ? '—' : n.toLocaleString('en-US'))
const fmtX = (n: number) => (n === 0 ? '—' : `${n.toFixed(2)}x`)

export default function WeeklyUpdatePage({ params }: { params: { id: string } }) {
  const fund = getFundById(params.id)
  if (!fund) return notFound()

  const isMCIV = params.id === 'mc-iv'
  const capActivity = isMCIV ? mcIVCapitalActivity : weeklyCapitalActivity
  const partnerData = isMCIV ? mcIVPartnerCapitalEvolution : weeklyPartnerCapitalEvolution
  const quarterlyData = isMCIV ? mcIVQuarterlyPerformance : weeklyQuarterlyPerformance
  const schedule = isMCIV ? mcIVInvestments : weeklySchedule

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#1e3535]">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#4DB6AC] mb-1">
            Weekly Update — PE Brazil Format
          </p>
          <h1 className="text-2xl font-bold text-white">{fund.name}</h1>
          <p className="text-sm text-[#90cac5] mt-1">
            {fund.group} · Vintage {fund.vintage} · As of 31 December 2025
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#90cac5]">Fund Size</p>
          <p className="text-lg font-bold text-white">${fund.fundSize.toLocaleString()}M</p>
          <p className="text-xs text-[#4DB6AC] mt-0.5">Net MOIC {fund.netMOIC.toFixed(2)}x · Net IRR {fund.netIRR.toFixed(1)}%</p>
        </div>
      </div>

      {/* 3-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Capital Activity */}
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-4">
          <p className="text-xs font-semibold text-white mb-0.5">Capital Activity</p>
          <p className="text-[0.65rem] text-[#90cac5] mb-3">YTD & Expected · USD M</p>
          <CapitalActivityChart data={capActivity} />
        </div>

        {/* Gross MOIC / Investment Chart */}
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-4">
          <p className="text-xs font-semibold text-white mb-0.5">Invested Capital vs Total Value</p>
          <p className="text-[0.65rem] text-[#90cac5] mb-3">Gross MOIC evolution · USD M</p>
          <InvestmentChart data={quarterlyData} />
        </div>

        {/* Partner Capital Evolution */}
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] p-4">
          <p className="text-xs font-semibold text-white mb-0.5">Partner's Capital Evolution</p>
          <p className="text-[0.65rem] text-[#90cac5] mb-3">Multi-quarter waterfall · USD M</p>
          <PartnerCapitalChart data={partnerData} />
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Gross MOIC', value: `${fund.grossMOIC.toFixed(2)}x` },
          { label: 'Net MOIC', value: `${fund.netMOIC.toFixed(2)}x` },
          { label: 'Gross IRR', value: `${fund.grossIRR.toFixed(1)}%` },
          { label: 'Net IRR', value: `${fund.netIRR.toFixed(1)}%` },
          { label: 'Total Called', value: `$${fund.totalCalled}M` },
          { label: 'Distributions', value: `$${fund.distributed}M` },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card py-3 px-4">
            <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#90cac5]">{kpi.label}</p>
            <p className="text-lg font-bold text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Schedule of Investments — simplified (no IRR) */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">Schedule of Investments</p>
        <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="table-teal-header">
                  <th className="text-left">Company</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Vintage</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Invested Capital</th>
                  <th className="text-right">Realized Value</th>
                  <th className="text-right">NAV</th>
                  <th className="text-right">Total Value</th>
                  <th className="text-right">Gross DPI</th>
                  <th className="text-right">Gross MOIC</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((inv, i) => (
                  <tr
                    key={String('id' in inv ? (inv as { id: string }).id : inv.company)}
                    className={`table-row-base hover:bg-[#243f3f] transition-colors ${i % 2 === 1 ? 'row-alt' : ''}`}
                  >
                    <td className="font-semibold text-white">{inv.company}</td>
                    <td className="text-[#90cac5]">{inv.description}</td>
                    <td className="text-[#90cac5]">{inv.vintage}</td>
                    <td>
                      <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-[#1e3535] text-[#90cac5]">
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-right">{fmt(inv.investedCapital)}</td>
                    <td className="text-right">{fmt(inv.realizedValue)}</td>
                    <td className="text-right">{fmt(inv.nav)}</td>
                    <td className="text-right font-semibold">{fmt(inv.totalValue)}</td>
                    <td className="text-right">{fmtX(inv.grossDPI)}</td>
                    <td className="text-right font-semibold">{fmtX(inv.grossMOIC)}</td>
                  </tr>
                ))}
                {/* Total */}
                <tr className="row-subtotal">
                  <td colSpan={4}>TOTAL</td>
                  <td className="text-right">{fmt(schedule.reduce((s, i) => s + i.investedCapital, 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, i) => s + i.realizedValue, 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, i) => s + i.nav, 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, i) => s + i.totalValue, 0))}</td>
                  <td className="text-right">—</td>
                  <td className="text-right">
                    {fmtX(
                      schedule.reduce((s, i) => s + i.investedCapital, 0) > 0
                        ? schedule.reduce((s, i) => s + i.totalValue, 0) /
                          schedule.reduce((s, i) => s + i.investedCapital, 0)
                        : 0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[#1e3535]">
            <p className="text-[0.65rem] text-[#90cac5] opacity-60">
              All figures in USD millions · As of 31 December 2025
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center justify-between text-[0.65rem] text-[#90cac5] opacity-50 pt-2 border-t border-[#1e3535]">
        <span>CONFIDENTIAL — For qualified investors only</span>
        <span>Mubadala Capital · Private Equity · Q4 2025</span>
      </div>
    </div>
  )
}
