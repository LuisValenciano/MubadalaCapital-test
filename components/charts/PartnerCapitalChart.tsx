'use client'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ReferenceLine,
} from 'recharts'

interface QuarterData {
  quarter: string
  openingNAV: number
  calls: number
  distributions: number
  pnl: number
  closingNAV: number
}

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d2626] border border-[#2d5555] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#4DB6AC] font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }} className="mb-0.5">
          {p.name}:{' '}
          <span className="font-bold text-white">
            {p.value > 0 ? '+' : ''}${p.value}M
          </span>
        </p>
      ))}
    </div>
  )
}

export default function PartnerCapitalChart({ data }: { data: QuarterData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3535" vertical={false} />
        <XAxis dataKey="quarter" tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} unit="M" width={60} />
        <ReferenceLine y={0} stroke="#2d5555" />
        <Tooltip content={customTooltip} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#90cac5', paddingTop: 8 }}
          iconType="square"
          iconSize={10}
        />
        <Bar dataKey="calls" name="Calls" fill="#4DB6AC" radius={[3, 3, 0, 0]} />
        <Bar dataKey="distributions" name="Distributions" fill="#00897B" radius={[3, 3, 0, 0]} />
        <Bar dataKey="pnl" name="P&L" fill="#ffd54f" radius={[3, 3, 0, 0]} />
        <Line
          dataKey="closingNAV"
          name="Closing NAV"
          type="monotone"
          stroke="#e2f0ef"
          strokeWidth={2}
          dot={{ fill: '#e2f0ef', r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
