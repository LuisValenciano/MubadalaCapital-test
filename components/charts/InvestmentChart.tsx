'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  quarter: string
  investedCapital: number
  nav: number
  realized: number
}

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d2626] border border-[#2d5555] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#4DB6AC] font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="mb-0.5">
          {p.name}: <span className="font-bold text-white">${p.value}M</span>
        </p>
      ))}
    </div>
  )
}

export default function InvestmentChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e3535" vertical={false} />
        <XAxis dataKey="quarter" tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} unit="M" width={55} />
        <Tooltip content={customTooltip} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#90cac5', paddingTop: 8 }}
          iconType="square"
          iconSize={10}
        />
        <Bar dataKey="investedCapital" name="Invested Capital" fill="#2d5555" stackId="a" radius={[0, 0, 4, 4]} />
        <Bar dataKey="nav" name="NAV" fill="#4DB6AC" stackId="b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="realized" name="Realized Value" fill="#00897B" stackId="b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
