import PptxGenJS from 'pptxgenjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── CSV utilities ───────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current); current = ''
    } else current += c
  }
  result.push(current)
  return result
}

function parseCSV(filename) {
  const content = fs.readFileSync(path.join(ROOT, 'data', filename), 'utf-8')
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const headers = parseCSVLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row = {}
    headers.forEach((h, i) => row[h] = (values[i] ?? '').trim())
    return row
  })
}

// ─── Data transformation (mirrors lib/all-funds-data.ts) ─────────────────────

const M = 1_000_000
const toNum = s => { const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n }
const dateKey = s => { const [m, d, y] = s.split('/'); return +y * 10000 + +m * 100 + +d }
const quarterLabel = s => `Q${Math.ceil(+s.split('/')[0] / 3)} ${s.split('/')[2]}`

function loadSOI(date) {
  const toNum = s => { const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n }
  const agg = new Map()
  const accumulate = (id, tv, ti, real) => {
    if (!id) return
    if (!agg.has(id)) agg.set(id, { tv: 0, ti: 0, real: 0 })
    const e = agg.get(id)
    e.tv += tv; e.ti += ti; e.real += real
  }
  for (const r of parseCSV('SOI Direct.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Total Income']) + toNum(r['Proceeds'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Total Value']), toNum(r['Investments']), real)
  }
  for (const r of parseCSV('SOI Fund.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Realized'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Adjusted NAV']) + real, toNum(r['Total Called']), real)
  }
  const result = new Map()
  for (const [id, { tv, ti, real }] of agg) {
    if (ti > 0) result.set(id, { grossMOIC: tv / ti, grossDPI: real / ti })
  }
  return result
}

function loadIRR(date) {
  const rows = parseCSV('IRR per Portfolio.csv').filter(r => r['Reporting Date'] === date && r['MC2025Q1FundID'])
  const byFund = new Map()
  for (const r of rows) {
    const id = r['MC2025Q1FundID']
    if (!byFund.has(id)) byFund.set(id, [])
    byFund.get(id).push(r)
  }
  const result = new Map()
  for (const [id, frows] of byFund) {
    const totalPaidIn = frows.reduce((s, r) => s + toNum(r['PAIDIN']), 0)
    // weighted-average IRR by PAIDIN; fall back to simple average if no PAIDIN
    const wIRR = totalPaidIn > 0
      ? frows.reduce((s, r) => s + toNum(r['IRR']) * toNum(r['PAIDIN']), 0) / totalPaidIn
      : frows.reduce((s, r) => s + toNum(r['IRR']), 0) / frows.length
    const totalTV = frows.reduce((s, r) => s + toNum(r['ADJUSTEDVALUATION']) + toNum(r['PAIDOUT']), 0)
    const totalPaidOut = frows.reduce((s, r) => s + toNum(r['PAIDOUT']), 0)
    result.set(id, {
      grossIRR: wIRR * 100,
      grossMOIC: totalPaidIn > 0 ? totalTV / totalPaidIn : 0,
      grossDPI: totalPaidIn > 0 ? totalPaidOut / totalPaidIn : 0,
    })
  }
  return result
}

function getData(dateArg) {
  const managed = parseCSV('Managed Funds.csv')
  const peqpr = parseCSV('PEQPR NAMES.csv')

  const dates = Array.from(new Set(managed.map(r => r['Reporting Date'])))
  const sorted = dates.sort((a, b) => dateKey(b) - dateKey(a))
  const reportingDate = dateArg && sorted.includes(dateArg) ? dateArg : sorted[0]

  const rows = managed.filter(r => r['Reporting Date'] === reportingDate)
  const grouped = new Map()
  for (const r of rows) {
    const id = r['MC2025Q1FundID']
    if (!grouped.has(id)) grouped.set(id, { called: 0, distributed: 0, nav: 0, commitment: 0 })
    const e = grouped.get(id)
    e.commitment += toNum(r['Commitment'])
    e.called += toNum(r['Called'])
    e.distributed += toNum(r['Distributed'])
    e.nav += toNum(r['Adjusted NAV'])
  }

  const irr = loadIRR(reportingDate)
  const soi = loadSOI(reportingDate)

  const funds = peqpr
    .map(f => {
      const id = f['MC2025Q1FundID']
      const d = grouped.get(id)
      if (!d) return null
      const ir = irr.get(id) ?? null
      const soiData = soi.get(id) ?? null
      const called = d.called / M
      const distributed = d.distributed / M
      const nav = d.nav / M
      const totalValue = distributed + nav
      return {
        id,
        name: f['Fund Name (Short)'],
        vintage: parseInt(f['Vintage']),
        group: f['Grouping'],
        sortOrder: parseInt(f['SortOrder']),
        fundSize: d.commitment / M,
        totalCalled: called,
        distributed,
        adjustedNAV: nav,
        totalValue,
        netDPI:   called > 0 ? distributed / called : null,
        netMOIC:  called > 0 ? totalValue / called  : null,
        netIRR:   null,
        grossDPI:  soiData?.grossDPI  ?? null,
        grossMOIC: soiData?.grossMOIC ?? null,
        grossIRR:  ir?.grossIRR ?? null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { funds, reportingDate, quarter: quarterLabel(reportingDate) }
}

// ─── Theme (PptxGenJS uses hex without #) — Light mode matching Power BI ─────

const C = {
  bg: 'FFFFFF',           // white slide background
  row: 'FFFFFF',          // white row
  rowAlt: 'F5F7F7',       // very light grey alternating row
  colHeaderBg: 'FFFFFF',  // column header background (white)
  colHeaderTxt: '4FA8A0', // column header text (teal)
  groupBar: '7FC5BF',     // light teal for group bar (with white text + totals)
  totalBar: '4FA8A0',     // medium teal for grand total
  teal: '4FA8A0',         // teal accent (subtitle)
  border: 'D5DCDC',       // light border
  text: '333333',         // body text dark grey
  textMid: '4FA8A0',      // subtitle teal
  white: 'FFFFFF',
  black: '1A1A1A',        // title text near-black
}

const fmt = n => n === 0 ? '—' : Math.round(n).toLocaleString('en-US')
const fmtX = n => (n == null || n === 0) ? '—' : `${n.toFixed(2)}x`
const fmtP = n => (n == null || n === 0) ? '—' : `${n.toFixed(1)}%`

// ─── Slide builder ───────────────────────────────────────────────────────────

function buildAllFundsSlide(pptx, funds, quarter, reportingDate) {
  const slide = pptx.addSlide()
  // Explicit fontFace on every text call — pptx.defaultFontFace alone doesn't inject <a:latin> in runs
  const txt = (content, opts) => slide.addText(content, { fontFace: 'D-DIN', ...opts })

  // Background
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.bg }, line: { type: 'none' } })

  // ─── Header — light mode, matching Power BI layout ───────────────────────
  // Logo: vertically centered with title+subtitle block, aspect ratio 3957:1029 ≈ 3.845:1
  slide.addImage({
    path: path.join(ROOT, 'public', 'Mubadala Logo_Stacked Center Aligned_Black.jpg'),
    x: 0.15, y: 0.26, w: 1.60, h: 0.42,
  })

  // Vertical separator — spans only logo-to-subtitle height
  slide.addShape(pptx.ShapeType.line, {
    x: 1.90, y: 0.26, w: 0, h: 0.52,
    line: { color: C.border, width: 0.75 },
  })

  // Title
  txt('Private Equity — All Funds', {
    x: 1.94, y: 0.16, w: 8.70, h: 0.42,
    fontSize: 22, bold: true, color: C.black,
  })

  // Subtitle (teal)
  const dt = new Date(reportingDate)
  const displayDate = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  txt('All funds (USD in Millions)', {
    x: 1.94, y: 0.56, w: 8.70, h: 0.22,
    fontSize: 11, bold: true, color: C.teal,
  })

  // Date top-right
  txt(displayDate, {
    x: 11.5, y: 0.30, w: 1.6, h: 0.30,
    fontSize: 11, color: C.black, align: 'right',
  })
  txt(quarter, {
    x: 11.5, y: 0.52, w: 1.6, h: 0.22,
    fontSize: 9, color: C.teal, align: 'right', bold: true,
  })

  // Horizontal separator between header and table (teal line, full width)
  slide.addShape(pptx.ShapeType.line, {
    x: 0.15, y: 0.90, w: 13.0, h: 0,
    line: { color: C.teal, width: 1.5 },
  })

  // ─── Table layout ────────────────────────────────────────────────────────
  // Column widths tuned to fill 12.83" available width (matching SVG proportions)
  const cols = [
    { key: 'name',        label: 'Fund Name',    w: 1.80, align: 'left',  bold: true },
    { key: 'vintage',     label: 'Vintage',      w: 0.85, align: 'left' },
    { key: 'fundSize',    label: 'Fund Size',    w: 1.00, align: 'right', fmt },
    { key: 'totalCalled', label: 'Total Called', w: 1.00, align: 'right', fmt },
    { key: 'distributed', label: 'Distributed',  w: 1.00, align: 'right', fmt },
    { key: 'adjustedNAV', label: 'Adjusted Nav', w: 1.15, align: 'right', fmt },
    { key: 'totalValue',  label: 'Total Value',  w: 1.00, align: 'right', fmt, bold: true },
    { key: 'netDPI',      label: 'Net DPI',      w: 0.88, align: 'right', fmt: fmtX },
    { key: 'netMOIC',     label: 'Net MOIC',     w: 0.83, align: 'right', fmt: fmtX, bold: true },
    { key: 'netIRR',      label: 'Net IRR',      w: 0.75, align: 'right', fmt: fmtP },
    { key: 'grossDPI',    label: 'Gross DPI',    w: 0.75, align: 'right', fmt: fmtX },
    { key: 'grossMOIC',   label: 'Gross MOIC',   w: 0.95, align: 'right', fmt: fmtX, bold: true },
    { key: 'grossIRR',    label: 'Gross IRR',    w: 0.87, align: 'right', fmt: fmtP },
  ]

  const startX = 0.25
  const startY = 0.95
  const rowH = 0.195
  const headerH = 0.28
  const groupH = 0.22
  const subH = 0.22
  const gtH = 0.26

  // Compute x positions
  let cx = startX
  cols.forEach(c => { c.x = cx; cx += c.w })
  const tableW = cols.reduce((s, c) => s + c.w, 0)

  let y = startY

  // Column header row (white bg, teal text — Power BI style)
  slide.addShape(pptx.ShapeType.rect, {
    x: startX, y, w: tableW, h: headerH,
    fill: { color: C.colHeaderBg }, line: { type: 'none' },
  })
  for (const c of cols) {
    txt(c.label, {
      x: c.x + 0.05, y: y + 0.02, w: c.w - 0.1, h: headerH - 0.04,
      fontSize: 9, bold: true, color: C.colHeaderTxt, align: c.align, valign: 'middle',
    })
  }
  // Bottom border under header
  slide.addShape(pptx.ShapeType.line, {
    x: startX, y: y + headerH, w: tableW, h: 0,
    line: { color: C.border, width: 0.75 },
  })
  y += headerH

  // Helper to draw a row of values
  function drawRow(values, opts) {
    const { bg, color = C.text, bold = false, height = rowH, fontSize = 8, italicFirstCell = false } = opts
    slide.addShape(pptx.ShapeType.rect, {
      x: startX, y, w: tableW, h: height,
      fill: { color: bg }, line: { type: 'none' },
    })
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i]
      const v = values[i]
      if (v == null || v === '') continue
      const fw = bold || c.bold
      txt(v, {
        x: c.x + 0.05, y: y + 0.01, w: c.w - 0.1, h: height - 0.02,
        fontSize, bold: fw, color, align: c.align, valign: 'middle',
      })
    }
    y += height
  }

  const groups = ['Flagship', 'Continuation', 'Co-Investment']

  for (const group of groups) {
    const groupFunds = funds.filter(f => f.group === group)
    if (groupFunds.length === 0) continue

    // Combined group bar — group name + subtotals in one teal row (PBI style)
    const sumF = (k) => groupFunds.reduce((s, f) => s + (f[k] ?? 0), 0)
    const calledSum = sumF('totalCalled')
    const tvSum = sumF('totalValue')
    const distSum = sumF('distributed')
    const groupValues = cols.map(c => {
      if (c.key === 'name') return group
      if (c.key === 'vintage') return ''
      if (c.key === 'fundSize') return fmt(sumF('fundSize'))
      if (c.key === 'totalCalled') return fmt(calledSum)
      if (c.key === 'distributed') return fmt(distSum)
      if (c.key === 'adjustedNAV') return fmt(sumF('adjustedNAV'))
      if (c.key === 'totalValue') return fmt(tvSum)
      if (c.key === 'netDPI') return calledSum > 0 ? fmtX(distSum / calledSum) : '—'
      if (c.key === 'netMOIC') return calledSum > 0 ? fmtX(tvSum / calledSum) : '—'
      return ''
    })
    drawRow(groupValues, { bg: C.groupBar, color: C.white, bold: true, height: groupH, fontSize: 9 })

    // Fund rows (alternating white / very light grey, dark text)
    groupFunds.forEach((f, i) => {
      const bg = i % 2 === 1 ? C.rowAlt : C.row
      const values = cols.map(c => {
        if (c.key === 'name') return f.name
        if (c.key === 'vintage') return String(f.vintage)
        if (c.key === 'grossIRR' && f.group === 'Co-Investment') return '—'
        return c.fmt(f[c.key])
      })
      drawRow(values, { bg, fontSize: 8.5, color: C.text })
    })

    y += 0.04
  }

  // Footer text
  txt(
    'All figures in USD millions  ·  Net IRR pending Metrics connection  ·  Past performance is not indicative of future results.',
    { x: 0.25, y: 7.20, w: 12.83, h: 0.20, fontSize: 7, color: '888888' },
  )

  // Footer teal line (matches PBI bottom border)
  slide.addShape(pptx.ShapeType.line, {
    x: 0.15, y: 7.42, w: 13.0, h: 0,
    line: { color: C.teal, width: 1.5 },
  })
}

// ─── Main ────────────────────────────────────────────────────────────────────

const dateArg = process.argv[2] // e.g. "12/31/2024"
const { funds, reportingDate, quarter } = getData(dateArg)
console.log(`✓ Loaded ${funds.length} funds for ${quarter} (${reportingDate})`)

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE' // 13.333" x 7.5"
pptx.title = `Mubadala Capital — All Funds ${quarter}`
pptx.author = 'Mubadala Capital'

pptx.defaultFontFace = 'D-DIN'

buildAllFundsSlide(pptx, funds, quarter, reportingDate)

const outDir = path.join(ROOT, 'output')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `AllFunds_Native_${quarter.replace(' ', '_')}.pptx`)
await pptx.writeFile({ fileName: outPath })
console.log(`✓ PPTX (native shapes): ${outPath}`)
