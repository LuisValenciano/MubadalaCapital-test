import Link from 'next/link'
import { FundRow, FundGroup } from '@/lib/all-funds-data'

const fmt = (n: number, dec = 0) =>
  n === 0 ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtX = (n: number | null) => (n == null || n === 0 ? '—' : `${n.toFixed(2)}x`)
const fmtPct = (n: number | null) => (n == null || n === 0 ? '—' : `${n.toFixed(1)}%`)

function sumField(arr: FundRow[], field: keyof FundRow): number {
  return arr.reduce((s, f) => s + ((f[field] as number) ?? 0), 0)
}

interface GroupRowsProps {
  group: FundGroup
  groupFunds: FundRow[]
  rowStart: number
}

function GroupRows({ group, groupFunds, rowStart }: GroupRowsProps) {
  const called = sumField(groupFunds, 'totalCalled')
  const distributed = sumField(groupFunds, 'distributed')
  const totalValue = sumField(groupFunds, 'totalValue')

  const subtotal = {
    fundSize: sumField(groupFunds, 'fundSize'),
    totalCalled: called,
    distributed,
    adjustedNAV: sumField(groupFunds, 'adjustedNAV'),
    totalValue,
    netDPI: called > 0 ? distributed / called : null,
    netMOIC: called > 0 ? totalValue / called : null,
  }

  return (
    <>
      <tr className="row-group-header">
        <td colSpan={11}>{group} Funds</td>
      </tr>

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
          <td className="text-right">{fmtPct(fund.grossIRR)}</td>
          <td className="text-right">{fmtPct(fund.netIRR)}</td>
          <td className="text-right">{fmtX(fund.grossMOIC)}</td>
          <td className="text-right">{fmtX(fund.netMOIC)}</td>
        </tr>
      ))}

      <tr className="row-subtotal">
        <td colSpan={2}>{group} Total</td>
        <td className="text-right">{fmt(subtotal.fundSize)}</td>
        <td className="text-right">{fmt(subtotal.totalCalled)}</td>
        <td className="text-right">{fmt(subtotal.distributed)}</td>
        <td className="text-right">{fmt(subtotal.adjustedNAV)}</td>
        <td className="text-right">{fmt(subtotal.totalValue)}</td>
        <td className="text-right">—</td>
        <td className="text-right">—</td>
        <td className="text-right">—</td>
        <td className="text-right">{fmtX(subtotal.netMOIC)}</td>
      </tr>
    </>
  )
}

interface FundsTableProps {
  funds: FundRow[]
}

export default function FundsTable({ funds }: FundsTableProps) {
  const groups: FundGroup[] = ['Flagship', 'Continuation', 'Co-Investment']

  const totalCalled = sumField(funds, 'totalCalled')
  const totalDistributed = sumField(funds, 'distributed')
  const totalValue = sumField(funds, 'totalValue')

  const grandTotal = {
    fundSize: sumField(funds, 'fundSize'),
    totalCalled,
    distributed: totalDistributed,
    adjustedNAV: sumField(funds, 'adjustedNAV'),
    totalValue,
    netMOIC: totalCalled > 0 ? totalValue / totalCalled : null,
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
              <th className="text-right">Gross IRR</th>
              <th className="text-right">Net IRR</th>
              <th className="text-right">Gross MOIC</th>
              <th className="text-right">Net MOIC</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const groupFunds = funds.filter((f) => f.group === group)
              if (groupFunds.length === 0) return null
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

            <tr className="row-subtotal" style={{ backgroundColor: '#00695C' }}>
              <td colSpan={2} className="text-base">TOTAL PORTFOLIO</td>
              <td className="text-right">{fmt(grandTotal.fundSize)}</td>
              <td className="text-right">{fmt(grandTotal.totalCalled)}</td>
              <td className="text-right">{fmt(grandTotal.distributed)}</td>
              <td className="text-right">{fmt(grandTotal.adjustedNAV)}</td>
              <td className="text-right">{fmt(grandTotal.totalValue)}</td>
              <td className="text-right">—</td>
              <td className="text-right">—</td>
              <td className="text-right">—</td>
              <td className="text-right">{fmtX(grandTotal.netMOIC)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-[#1e3535]">
        <p className="text-[0.65rem] text-[#90cac5] opacity-60">
          All figures in USD millions · IRR / MOIC pending Metrics connection · Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  )
}
