interface KPICardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
}

export default function KPICard({ label, value, sub, accent }: KPICardProps) {
  return (
    <div
      className={`kpi-card flex flex-col gap-1 ${
        accent ? 'border-[#4DB6AC]' : ''
      }`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#90cac5]">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[0.7rem] text-[#4DB6AC] font-medium">{sub}</p>}
    </div>
  )
}
