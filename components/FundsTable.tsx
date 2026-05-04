'use client'
import Link from 'next/link'
import { funds, Fund, FundGroup } from '@/lib/mock-data'

const fmt = (n: number, dec = 0) =>
  n === 0 ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtX = (n: number) => (n === 0 ? '—' : `${n.toFixed(2)}x`)
const fmtPct = (n: number) => (n === 0 ? '—' : `${n.toFixed(1)}%`)

function sumField(arr: Fund[], field: keyof Fund): number {
  return arr.reduce((s, f) => s + (f[field] as number), 0)
}

function weightedMean(arr: Fund[], valField: keyof Fund, weightField: keyof Fund): number {
  const totalW = arr.reduce((s, f) => s + (f[weightField] as number), 0)
  if (totalW === 0) return 0
  return arr.reduce((s, f) => s + (f[valField] as number) * (f[weightField] as number), 0) / totalW
}

interface GroupRowsProps {
  group: FundGroup
  groupFunds: Fund[]
  rowStart: number
}

function GroupRows({ group, groupFunds, rowStart }: GroupRowsProps) {
  const total = {
    fundSize: sumField(groupFunds, 'fundSize'),
    totalCalled: sumField(groupFunds, 'totalCalled'),
    distributed: sumField(groupFunds, 'distributed'),
    adjustedNAV: sumField(groupFunds, 'adjustedNAV'),
    totalValue: sumField(groupFunds, 'totalValue'),
    netDPI: groupFunds[0].totalCalled > 0
      ? sumField(groupFunds, 'distributed') / sumField(groupFunds, 'totalCalled')
      : 0,
    netMOIC: sumField(groupFunds, 'totalCalled') > 0
      ? sumField(groupFunds, 'totalValue') / sumField(groupFunds, 'totalCalled')
      : 0,
    netIRR: weightedMean(groupFunds, 'netIRR', 'totalCalled'),
    grossDPI: sumField(groupFunds, 'totalCalled') > 0
      ? sumField(groupFunds, 'distributed') / sumField(groupFunds, 'totalCalled')
      : 0,
    grossMOIC: sumField(groupFunds, 'totalCalled') > 0
      ? sumField(groupFunds, 'totalValue') / sumField(groupFunds, 'totalCalled')
      : 0,
    grossIRR: weightedMean(groupFunds, 'grossIRR', 'totalCalled'),
  }

  return (
    <>
      {/* Group header */}
      <tr className="row-group-header">
        <td colSpan={14}>{group} Funds</td>
      </tr>

      {/* Fund rows */}
      {groupFunds.map((fund, i) => (
        <tr
          key={fund.id}
          className={`table-row-base hover:bg-[#243f3f] cursor-pointer transition-colors ${
            (rowStart + i) % 2 === 1 ? 'row-alt' : ''
          }`}
        >
          <td>
            <Link
              href={`/fund/${fund.id}`}
              className="text-[#4DB6AC] hover:text-white font-semibold transition-colors"
            >
              {fund.name}
            </Link>
          </td>
          <td className="text-[#90cac5]">{fund.vintage}</td>
          <td className="text-right">{fmt(fund.fundSize)}</td>
          <td className="text-right">{fmt(fund.totalCalled)}</td>
          <td className="text-right">{fmt(fund.distributed)}</td>
          <td className="text-right">{fmt(fund.adjustedNAV)}</td>
          <td className="text-right font-semibold">{fmt(fund.totalValue)}</td>
          <td className="text-right">{fmtX(fund.netDPI)}</td>
          <td className="text-right font-semibold">{fmtX(fund.netMOIC)}</td>
          <td className="text-right">{fmtPct(fund.netIRR)}</td>
          <td className="text-right">{fmtX(fund.grossDPI)}</td>
          <td className="text-right font-semibold">{fmtX(fund.grossMOIC)}</td>
          <td className="text-right">{fmtPct(fund.grossIRR)}</td>
        </tr>
      ))}

      {/* Group subtotal */}
      <tr className="row-subtotal">
        <td colSpan={2}>{group} Total</td>
        <td className="text-right">{fmt(total.fundSize)}</td>
        <td className="text-right">{fmt(total.totalCalled)}</td>
        <td className="text-right">{fmt(total.distributed)}</td>
        <td className="text-right">{fmt(total.adjustedNAV)}</td>
        <td className="text-right">{fmt(total.totalValue)}</td>
        <td className="text-right">{fmtX(total.netDPI)}</td>
        <td className="text-right">{fmtX(total.netMOIC)}</td>
        <td className="text-right">{fmtPct(total.netIRR)}</td>
        <td className="text-right">{fmtX(total.grossDPI)}</td>
        <td className="text-right">{fmtX(total.grossMOIC)}</td>
        <td className="text-right">{fmtPct(total.grossIRR)}</td>
      </tr>
    </>
  )
}

export default function FundsTable() {
  const groups: FundGroup[] = ['Flagship', 'Continuation', 'Co-Investment']

  const grandTotal = {
    fundSize: sumField(funds, 'fundSize'),
    totalCalled: sumField(funds, 'totalCalled'),
    distributed: sumField(funds, 'distributed'),
    adjustedNAV: sumField(funds, 'adjustedNAV'),
    totalValue: sumField(funds, 'totalValue'),
    netMOIC: sumField(funds, 'totalCalled') > 0
      ? sumField(funds, 'totalValue') / sumField(funds, 'totalCalled')
      : 0,
    netIRR: weightedMean(funds, 'netIRR', 'totalCalled'),
    grossMOIC: sumField(funds, 'totalCalled') > 0
      ? sumField(funds, 'totalValue') / sumField(funds, 'totalCalled')
      : 0,
    grossIRR: weightedMean(funds, 'grossIRR', 'totalCalled'),
  }

  let rowIdx = 0
  return (
    <div className="bg-[#0d2626] rounded-xl border border-[#1e3535] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="table-teal-header">
              <th className="text-left">Fund Name</th>
              <th className="text-left">Vintage</th>
              <th className="text-right">Fund Size</th>
              <th className="text-right">Total Called</th>
              <th className="text-right">Distributed</th>
              <th className="text-right">Adj. NAV</th>
              <th className="text-right">Total Value</th>
              <th className="text-right">Net DPI</th>
              <th className="text-right">Net MOIC</th>
              <th className="text-right">Net IRR</th>
              <th className="text-right">Gross DPI</th>
              <th className="text-right">Gross MOIC</th>
              <th className="text-right">Gross IRR</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const groupFunds = funds.filter((f) => f.group === group)
              const startIdx = rowIdx
              rowIdx += groupFunds.length
              return (
                <GroupRows
                  key={group}
                  group={group}
                  groupFunds={groupFunds}
                  rowStart={startIdx}
                />
              )
            })}

            {/* Grand Total */}
            <tr className="row-subtotal" style={{ backgroundColor: '#00695C' }}>
              <td colSpan={2} className="text-base">TOTAL PORTFOLIO</td>
              <td className="text-right">{fmt(grandTotal.fundSize)}</td>
              <td className="text-right">{fmt(grandTotal.totalCalled)}</td>
              <td className="text-right">{fmt(grandTotal.distributed)}</td>
              <td className="text-right">{fmt(grandTotal.adjustedNAV)}</td>
              <td className="text-right">{fmt(grandTotal.totalValue)}</td>
              <td className="text-right">—</td>
              <td className="text-right">{fmtX(grandTotal.netMOIC)}</td>
              <td className="text-right">{fmtPct(grandTotal.netIRR)}</td>
              <td className="text-right">—</td>
              <td className="text-right">{fmtX(grandTotal.grossMOIC)}</td>
              <td className="text-right">{fmtPct(grandTotal.grossIRR)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-[#1e3535] flex items-center gap-4">
        <p className="text-[0.65rem] text-[#90cac5] opacity-60">
          All figures in USD millions · As of 31 December 2025 · Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  )
}
