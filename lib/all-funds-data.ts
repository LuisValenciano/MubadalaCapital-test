import { parseCSV } from './csv-loader'

export type FundGroup = 'Flagship' | 'Continuation' | 'Co-Investment'

export interface FundRow {
  id: string
  name: string
  vintage: number
  group: FundGroup
  sortOrder: number
  fundSize: number      // USD millions
  totalCalled: number   // USD millions
  distributed: number   // USD millions
  adjustedNAV: number   // USD millions
  totalValue: number    // USD millions
  // From IRR per Portfolio CSV (Gross only)
  grossIRR: number | null
  grossMOIC: number | null
  grossDPI: number | null
  // From Metrics table — null until connected
  netIRR: number | null
  netMOIC: number | null
  netDPI: number | null
}

export interface Quarter {
  date: string   // raw CSV date e.g. "3/31/2026"
  label: string  // display e.g. "Q1 2026"
}

const M = 1_000_000

function toNum(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

function dateToSortKey(dateStr: string): number {
  const [m, d, y] = dateStr.split('/')
  return parseInt(y) * 10000 + parseInt(m) * 100 + parseInt(d)
}

function formatQuarterLabel(dateStr: string): string {
  const month = parseInt(dateStr.split('/')[0])
  const year = dateStr.split('/')[2]
  const q = Math.ceil(month / 3)
  return `Q${q} ${year}`
}

export function getAvailableQuarters(): Quarter[] {
  const managed = parseCSV('Managed Funds.csv')
  const dates = Array.from(new Set(managed.map((r) => r['Reporting Date'])))
  return dates
    .sort((a, b) => dateToSortKey(b) - dateToSortKey(a))
    .map((date) => ({ date, label: formatQuarterLabel(date) }))
}

function loadIRRData(date: string): Map<string, { grossIRR: number; grossMOIC: number; grossDPI: number }> {
  const rows = parseCSV('IRR per Portfolio.csv').filter((r) => r['Reporting Date'] === date && r['MC2025Q1FundID'])

  // Group by fund ID — only use funds with a single portfolio row to avoid incorrect aggregation
  const byFund = new Map<string, typeof rows>()
  for (const row of rows) {
    const id = row['MC2025Q1FundID']
    if (!byFund.has(id)) byFund.set(id, [])
    byFund.get(id)!.push(row)
  }

  const result = new Map<string, { grossIRR: number; grossMOIC: number; grossDPI: number }>()
  for (const [id, fundRows] of Array.from(byFund)) {
    if (fundRows.length === 1) {
      const r = fundRows[0]
      result.set(id, {
        grossIRR: toNum(r['IRR']) * 100,   // convert to % (0.1612 → 16.12%)
        grossMOIC: toNum(r['TVPI']),
        grossDPI: toNum(r['DPI']),
      })
    }
    // funds with multiple sub-portfolio rows (Directs + Funds split) are left as null
    // IRR cannot be correctly averaged — requires cash flow data
  }
  return result
}

export function getAllFundsData(date?: string): { funds: FundRow[]; reportingDate: string } {
  const managed = parseCSV('Managed Funds.csv')
  const peqpr = parseCSV('PEQPR NAMES.csv')

  // Determine reporting date
  const allDates = Array.from(new Set(managed.map((r) => r['Reporting Date'])))
  const sortedDates = allDates.sort((a, b) => dateToSortKey(b) - dateToSortKey(a))
  const reportingDate = date && sortedDates.includes(date) ? date : sortedDates[0]

  // Filter Managed Funds to selected date
  const rows = managed.filter((r) => r['Reporting Date'] === reportingDate)

  // Group by MC2025Q1FundID: pivot Commitment by Invested By, sum Called/Distributed/NAV
  type Entry = { called: number; distributed: number; nav: number; commitment: number }
  const grouped = new Map<string, Entry>()
  for (const row of rows) {
    const id = row['MC2025Q1FundID']
    if (!grouped.has(id)) grouped.set(id, { called: 0, distributed: 0, nav: 0, commitment: 0 })
    const e = grouped.get(id)!
    e.commitment += toNum(row['Commitment'])
    e.called += toNum(row['Called'])
    e.distributed += toNum(row['Distributed'])
    e.nav += toNum(row['Adjusted NAV'])
  }

  // Load IRR per Portfolio for the same date
  const irrData = loadIRRData(reportingDate)

  // Join Investee_Names + Summary Fact + IRR
  const funds = peqpr
    .map((fund): FundRow | null => {
      const id = fund['MC2025Q1FundID']
      const data = grouped.get(id)
      if (!data) return null

      const irr = irrData.get(id) ?? null

      return {
        id,
        name: fund['Fund Name (Short)'],
        vintage: parseInt(fund['Vintage']),
        group: fund['Grouping'] as FundGroup,
        sortOrder: parseInt(fund['SortOrder']),
        fundSize: data.commitment / M,
        totalCalled: data.called / M,
        distributed: data.distributed / M,
        adjustedNAV: data.nav / M,
        totalValue: (data.distributed + data.nav) / M,
        grossIRR: irr?.grossIRR ?? null,
        grossMOIC: irr?.grossMOIC ?? null,
        grossDPI: irr?.grossDPI ?? null,
        netIRR: null,
        netMOIC: null,
        netDPI: null,
      }
    })
    .filter((f): f is FundRow => f !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { funds, reportingDate }
}
