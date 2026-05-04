'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { funds } from '@/lib/mock-data'
import clsx from 'clsx'

const flagshipFunds = funds.filter((f) => f.group === 'Flagship')
const continuationFunds = funds.filter((f) => f.group === 'Continuation')
const coFunds = funds.filter((f) => f.group === 'Co-Investment')

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={clsx(
        'block px-3 py-1.5 rounded-md text-sm transition-colors duration-150',
        active
          ? 'bg-[#00695C] text-white font-semibold'
          : 'text-[#90cac5] hover:bg-[#1e3535] hover:text-white'
      )}
    >
      {children}
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-700 uppercase tracking-widest text-[#4DB6AC] px-3 pt-4 pb-1 opacity-80">
      {children}
    </p>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-56 min-w-[224px] bg-[#0d2626] border-r border-[#1e3535] flex flex-col py-4 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 pb-5 border-b border-[#1e3535]">
        <p className="text-[#4DB6AC] text-xs font-semibold tracking-widest uppercase opacity-70 mb-0.5">
          Mubadala
        </p>
        <p className="text-white font-bold text-sm tracking-wide leading-tight">Capital</p>
        <p className="text-[#90cac5] text-[0.65rem] mt-1 uppercase tracking-widest">PE Dashboard</p>
      </div>

      <nav className="flex-1 px-2 mt-2 space-y-0.5">
        <SectionLabel>Overview</SectionLabel>
        <NavLink href="/">All Funds</NavLink>

        <SectionLabel>Flagship</SectionLabel>
        {flagshipFunds.map((f) => (
          <NavLink key={f.id} href={`/fund/${f.id}`}>
            {f.name}
          </NavLink>
        ))}

        <SectionLabel>Continuation</SectionLabel>
        {continuationFunds.map((f) => (
          <NavLink key={f.id} href={`/fund/${f.id}`}>
            {f.name}
          </NavLink>
        ))}

        <SectionLabel>Co-Investment</SectionLabel>
        {coFunds.map((f) => (
          <NavLink key={f.id} href={`/fund/${f.id}`}>
            {f.name}
          </NavLink>
        ))}

        <SectionLabel>Weekly Updates</SectionLabel>
        <NavLink href="/weekly/mdc-ii">MDC II — Brazil</NavLink>
        <NavLink href="/weekly/mic-iii">MIC III — Brazil</NavLink>
      </nav>

      <div className="px-4 pt-4 border-t border-[#1e3535]">
        <p className="text-[0.6rem] text-[#4DB6AC] opacity-60 uppercase tracking-widest">
          Confidential
        </p>
        <p className="text-[0.6rem] text-[#90cac5] opacity-50 mt-0.5">
          © 2025 Mubadala Capital
        </p>
      </div>
    </aside>
  )
}
