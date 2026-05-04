import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFundById, mcIVInvestments, Investment } from '@/lib/mock-data'

const fmt = (n: number, dec = 0) =>
  n === 0 ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const fmtX = (n: number) => (n === 0 ? '—' : `${n.toFixed(2)}x`)
const fmtPct = (n: number) => (n === 0 ? '—' : `${n.toFixed(1)}%`)

function StatusBadge({ status }: { status: Investment['status'] }) {
  const colors: Record<Investment['status'], string> = {
    Realized: 'bg-[#00695C] text-[#b2dfdb]',
    'Partially Realized': 'bg-[#0d4040] text-[#4DB6AC]',
    Unrealized: 'bg-[#1e3535] text-[#90cac5]',
  }
  return (
    <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>
      {status}
    </span>
  )
}

function generateSchedule(fund: { id: string; totalCalled: number; distributed: number; adjustedNAV: number; numUnrealizedInvestments: number }) {
  const n = Math.max(fund.numUnrealizedInvestments, 3)
  const companies = ['Alpha Portfolio Co', 'Beta Holdings', 'Gamma Ventures', 'Delta Group', 'Epsilon Capital', 'Zeta Industries']
  const descs = ['Consumer & retail', 'Healthcare services', 'Technology & digital', 'Industrial manufacturing', 'Financial services', 'Infrastructure & energy']
  const navPerCo = Math.round(fund.adjustedNAV / n)
  const investedPerCo = Math.round(fund.totalCalled / n)
  const distPerCo = Math.round(fund.distributed / n)

  return Array.from({ length: n }, (_, i) => ({
    id: `${fund.id}-co-${i}`,
    fundId: fund.id,
    category: (i < Math.ceil(n / 2) ? 'Controlled' : 'Non-Controlled') as 'Controlled' | 'Non-Controlled',
    company: companies[i % companies.length],
    description: descs[i % descs.length],
    vintage: 2022 + Math.floor(i / 3),
    status: (distPerCo > 0 && i === 0 ? 'Partially Realized' : 'Unrealized') as Investment['status'],
    investedCapital: investedPerCo,
    realizedValue: i === 0 ? distPerCo : 0,
    nav: navPerCo,
    totalValue: navPerCo + (i === 0 ? distPerCo : 0),
    grossDPI: i === 0 && investedPerCo > 0 ? distPerCo / investedPerCo : 0,
    grossMOIC: investedPerCo > 0 ? (navPerCo + (i === 0 ? distPerCo : 0)) / investedPerCo : 0,
    grossIRR: 8 + i * 2.5,
  }))
}

export default function SchedulePage({ params }: { params: { id: string } }) {
  const fund = getFundById(params.id)
  if (!fund) return notFound()

  const investments = params.id === 'mc-iv' ? mcIVInvestments : generateSchedule(fund)

  const controlled = investments.filter((i) => i.category === 'Controlled')
  const nonControlled = investments.filter((i) => i.category === 'Non-Controlled')

  const subtotal = (arr: typeof investments) => ({
    investedCapital: arr.reduce((s, i) => s + i.investedCapital, 0),
    realizedValue: arr.reduce((s, i) => s + i.realizedValue, 0),
    nav: arr.reduce((s, i) => s + i.nav, 0),
    totalValue: arr.reduce((s, i) => s + i.totalValue, 0),
    grossMOIC: arr.reduce((s, i) => s + i.investedCapital, 0) > 0
      ? arr.reduce((s, i) => s + i.totalValue, 0) / arr.reduce((s, i) => s + i.investedCapital, 0)
      : 0,
  })

  const ctrlTotal = subtotal(controlled)
  const nonCtrlTotal = subtotal(nonControlled)
  const grandTotal = subtotal(investments)

  const tabs = [
    { label: 'Overview', href: `/fund/${fund.id}`, active: false },
    { label: 'Fund Activity', href: `/fund/${fund.id}/activity`, active: false },
    { label: 'Schedule of Investments', href: `/fund/${fund.id}/schedule`, active: true },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#90cac5]">
        <Link href="/" className="hover:text-[#4DB6AC] transition-colors">All Funds</Link>
        <span>/</span>
        <Link href={`/fund/${fund.id}`} className="hover:text-[#4DB6AC] transition-colors">{fund.name}</Link>
        <span>/</span>
        <span className="text-[#4DB6AC] font-semibold">Schedule of Investments</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{fund.name} — Schedule of Investments</h1>
            <span className="badge-teal">{fund.group}</span>
          </div>
          <p className="text-sm text-[#90cac5] mt-1">As of 31 December 2025 · USD millions</p>
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

      {/* Table */}
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
                <th className="text-right">Gross IRR</th>
              </tr>
            </thead>
            <tbody>
              {/* Controlled */}
              <tr className="row-group-header">
                <td colSpan={11}>Controlled Investments</td>
              </tr>
              {controlled.map((inv, i) => (
                <tr key={inv.id} className={`table-row-base hover:bg-[#243f3f] transition-colors ${i % 2 === 1 ? 'row-alt' : ''}`}>
                  <td className="font-semibold text-white">{inv.company}</td>
                  <td className="text-[#90cac5]">{inv.description}</td>
                  <td className="text-[#90cac5]">{inv.vintage}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right">{fmt(inv.investedCapital)}</td>
                  <td className="text-right">{fmt(inv.realizedValue)}</td>
                  <td className="text-right">{fmt(inv.nav)}</td>
                  <td className="text-right font-semibold">{fmt(inv.totalValue)}</td>
                  <td className="text-right">{fmtX(inv.grossDPI)}</td>
                  <td className="text-right font-semibold">{fmtX(inv.grossMOIC)}</td>
                  <td className="text-right">{fmtPct(inv.grossIRR)}</td>
                </tr>
              ))}
              <tr className="row-subtotal">
                <td colSpan={4}>Controlled Subtotal</td>
                <td className="text-right">{fmt(ctrlTotal.investedCapital)}</td>
                <td className="text-right">{fmt(ctrlTotal.realizedValue)}</td>
                <td className="text-right">{fmt(ctrlTotal.nav)}</td>
                <td className="text-right">{fmt(ctrlTotal.totalValue)}</td>
                <td className="text-right">—</td>
                <td className="text-right">{fmtX(ctrlTotal.grossMOIC)}</td>
                <td className="text-right">—</td>
              </tr>

              {/* Non-Controlled */}
              {nonControlled.length > 0 && (
                <>
                  <tr className="row-group-header">
                    <td colSpan={11}>Non-Controlled Investments</td>
                  </tr>
                  {nonControlled.map((inv, i) => (
                    <tr key={inv.id} className={`table-row-base hover:bg-[#243f3f] transition-colors ${i % 2 === 1 ? 'row-alt' : ''}`}>
                      <td className="font-semibold text-white">{inv.company}</td>
                      <td className="text-[#90cac5]">{inv.description}</td>
                      <td className="text-[#90cac5]">{inv.vintage}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-right">{fmt(inv.investedCapital)}</td>
                      <td className="text-right">{fmt(inv.realizedValue)}</td>
                      <td className="text-right">{fmt(inv.nav)}</td>
                      <td className="text-right font-semibold">{fmt(inv.totalValue)}</td>
                      <td className="text-right">{fmtX(inv.grossDPI)}</td>
                      <td className="text-right font-semibold">{fmtX(inv.grossMOIC)}</td>
                      <td className="text-right">{fmtPct(inv.grossIRR)}</td>
                    </tr>
                  ))}
                  <tr className="row-subtotal">
                    <td colSpan={4}>Non-Controlled Subtotal</td>
                    <td className="text-right">{fmt(nonCtrlTotal.investedCapital)}</td>
                    <td className="text-right">{fmt(nonCtrlTotal.realizedValue)}</td>
                    <td className="text-right">{fmt(nonCtrlTotal.nav)}</td>
                    <td className="text-right">{fmt(nonCtrlTotal.totalValue)}</td>
                    <td className="text-right">—</td>
                    <td className="text-right">{fmtX(nonCtrlTotal.grossMOIC)}</td>
                    <td className="text-right">—</td>
                  </tr>
                </>
              )}

              {/* Grand Total */}
              <tr className="row-subtotal" style={{ backgroundColor: '#00695C' }}>
                <td colSpan={4} className="text-base">TOTAL</td>
                <td className="text-right">{fmt(grandTotal.investedCapital)}</td>
                <td className="text-right">{fmt(grandTotal.realizedValue)}</td>
                <td className="text-right">{fmt(grandTotal.nav)}</td>
                <td className="text-right">{fmt(grandTotal.totalValue)}</td>
                <td className="text-right">—</td>
                <td className="text-right">{fmtX(grandTotal.grossMOIC)}</td>
                <td className="text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#1e3535]">
          <p className="text-[0.65rem] text-[#90cac5] opacity-60">
            All figures in USD millions · Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </div>
  )
}
