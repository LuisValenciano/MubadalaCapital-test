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
  Cell,
} from 'recharts'

interface CapitalActivityData {
  commitment: number
  contributions: number
  distributions: number
  unused: number
  pctContributed: number
  pctReturned: number
}

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d2626] border border-[#2d5555] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#4DB6AC] font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="mb-0.5">
          {p.name}: <span className="font-bold text-white">${p.value}M</span>
        </p>
      ))}
    </div>
  )
}

export default function CapitalActivityChart({ data }: { data: CapitalActivityData }) {
  const chartData = [
    { name: 'Commitment', value: data.commitment, fill: '#2d5555' },
    { name: 'Contributions', value: data.contributions, fill: '#4DB6AC' },
    { name: 'Distributions', value: data.distributions, fill: '#00897B' },
    { name: 'Unused', value: data.unused, fill: '#1e3535' },
  ]

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3535" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#90cac5', fontSize: 11 }} axisLine={false} tickLine={false} unit="M" width={55} />
          <Tooltip content={customTooltip} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Badges */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-[#1e3535] rounded-md px-3 py-1.5 text-xs">
          <span className="text-[#90cac5]">% Contributed</span>
          <span className="text-[#4DB6AC] font-bold">{data.pctContributed.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1e3535] rounded-md px-3 py-1.5 text-xs">
          <span className="text-[#90cac5]">% Returned</span>
          <span className="text-[#00897B] font-bold">{data.pctReturned.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
