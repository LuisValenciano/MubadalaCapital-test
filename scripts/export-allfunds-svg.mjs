import PptxGenJS from 'pptxgenjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
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
    if (frows.length === 1) {
      const r = frows[0]
      result.set(id, {
        grossIRR: toNum(r['IRR']) * 100,
        grossMOIC: toNum(r['TVPI']),
        grossDPI: toNum(r['DPI']),
      })
    }
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

  const funds = peqpr
    .map(f => {
      const id = f['MC2025Q1FundID']
      const d = grouped.get(id)
      if (!d) return null
      const ir = irr.get(id) ?? null
      return {
        id,
        name: f['Fund Name (Short)'],
        vintage: parseInt(f['Vintage']),
        group: f['Grouping'],
        sortOrder: parseInt(f['SortOrder']),
        fundSize: d.commitment / M,
        totalCalled: d.called / M,
        distributed: d.distributed / M,
        adjustedNAV: d.nav / M,
        totalValue: (d.distributed + d.nav) / M,
        grossIRR: ir?.grossIRR ?? null,
        grossMOIC: ir?.grossMOIC ?? null,
        grossDPI: ir?.grossDPI ?? null,
        netIRR: null,
        netMOIC: null,
        netDPI: null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { funds, reportingDate, quarter: quarterLabel(reportingDate) }
}

// ─── SVG generation ──────────────────────────────────────────────────────────

const C = {
  bg: '#0a1f1f',
  card: '#0d2626',
  rowAlt: '#1a2e2e',
  groupHeader: '#0d4040',
  teal: '#4DB6AC',
  tealDark: '#00897B',
  tealDeep: '#00695C',
  border: '#2d5555',
  text: '#e2f0ef',
  textMid: '#90cac5',
  white: '#FFFFFF',
}

const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const fmt = n => n === 0 ? '—' : Math.round(n).toLocaleString('en-US')
const fmtX = n => (n == null || n === 0) ? '—' : `${n.toFixed(2)}x`
const fmtP = n => (n == null || n === 0) ? '—' : `${n.toFixed(1)}%`

function renderAllFundsSVG(funds, quarter, reportingDate) {
  const W = 1920, H = 1080
  const PAD = 40
  const FONT = 'Calibri, Arial, sans-serif'

  // Column layout (must sum to W - 2*PAD = 1840)
  const cols = [
    { key: 'name',        label: 'FUND NAME',   w: 250, align: 'left'  },
    { key: 'vintage',     label: 'VINTAGE',     w: 100, align: 'left'  },
    { key: 'fundSize',    label: 'FUND SIZE',   w: 165, align: 'right', fmt },
    { key: 'totalCalled', label: 'CALLED',      w: 165, align: 'right', fmt },
    { key: 'distributed', label: 'DISTRIBUTED', w: 165, align: 'right', fmt },
    { key: 'adjustedNAV', label: 'ADJ. NAV',    w: 155, align: 'right', fmt },
    { key: 'totalValue',  label: 'TOTAL VALUE', w: 175, align: 'right', fmt, bold: true },
    { key: 'grossIRR',    label: 'GROSS IRR',   w: 140, align: 'right', fmt: fmtP },
    { key: 'netIRR',      label: 'NET IRR',     w: 140, align: 'right', fmt: fmtP },
    { key: 'grossMOIC',   label: 'GROSS MOIC',  w: 165, align: 'right', fmt: fmtX, bold: true },
    { key: 'netMOIC',     label: 'NET MOIC',    w: 220, align: 'right', fmt: fmtX, bold: true },
  ]
  // Verify alignment
  const totalColW = cols.reduce((s, c) => s + c.w, 0)
  const tableX = PAD
  const tableW = totalColW

  // Pre-compute x positions
  let cx = tableX
  for (const c of cols) { c.x = cx; cx += c.w }

  // Display date
  const dt = new Date(reportingDate)
  const displayDate = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const out = []
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`)
  out.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

  // ─── Title bar ───────────────────────────────────────────────────────────
  out.push(`<text x="${PAD}" y="62" font-family="${FONT}" font-size="32" font-weight="700" fill="${C.white}" letter-spacing="0.5">Private Equity Quarterly Report — All Funds</text>`)
  out.push(`<text x="${PAD}" y="98" font-family="${FONT}" font-size="18" fill="${C.textMid}">As of ${displayDate} · All figures in USD millions</text>`)

  // Quarter badge (top right)
  const badgeW = 120, badgeH = 38, badgeX = W - PAD - badgeW, badgeY = 50
  out.push(`<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="6" fill="${C.tealDeep}"/>`)
  out.push(`<text x="${badgeX + badgeW / 2}" y="${badgeY + 25}" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.white}" text-anchor="middle">${quarter}</text>`)

  // ─── Table ───────────────────────────────────────────────────────────────
  const tableY = 140
  const headerH = 38
  const rowH = 28
  const groupH = 30
  let y = tableY

  // Header row
  out.push(`<rect x="${tableX}" y="${y}" width="${tableW}" height="${headerH}" fill="${C.tealDark}"/>`)
  for (const c of cols) {
    const tx = c.align === 'right' ? c.x + c.w - 12 : c.x + 12
    const ta = c.align === 'right' ? 'end' : 'start'
    out.push(`<text x="${tx}" y="${y + 25}" font-family="${FONT}" font-size="13" font-weight="700" fill="${C.white}" text-anchor="${ta}" letter-spacing="0.5">${escXml(c.label)}</text>`)
  }
  y += headerH

  const groups = ['Flagship', 'Continuation', 'Co-Investment']

  // Helper to draw a row of values
  function drawRow(values, opts) {
    const { bg, color = C.text, bold = false, height = rowH, fontSize = 14 } = opts
    out.push(`<rect x="${tableX}" y="${y}" width="${tableW}" height="${height}" fill="${bg}"/>`)
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i]
      const v = values[i]
      if (v == null || v === '') continue
      const tx = c.align === 'right' ? c.x + c.w - 12 : c.x + 12
      const ta = c.align === 'right' ? 'end' : 'start'
      const fw = (bold || c.bold) ? '700' : '400'
      const fc = (i === 0 && opts.firstCellTeal) ? C.teal : color
      out.push(`<text x="${tx}" y="${y + height / 2 + 5}" font-family="${FONT}" font-size="${fontSize}" font-weight="${fw}" fill="${fc}" text-anchor="${ta}">${escXml(v)}</text>`)
    }
    y += height
  }

  // Per-group rendering
  for (const group of groups) {
    const groupFunds = funds.filter(f => f.group === group)
    if (groupFunds.length === 0) continue

    // Group header bar
    out.push(`<rect x="${tableX}" y="${y}" width="${tableW}" height="${groupH}" fill="${C.groupHeader}"/>`)
    out.push(`<text x="${tableX + 14}" y="${y + 21}" font-family="${FONT}" font-size="13" font-weight="700" fill="${C.teal}" letter-spacing="1">${group.toUpperCase()} FUNDS</text>`)
    y += groupH

    // Fund rows
    groupFunds.forEach((f, i) => {
      const bg = i % 2 === 1 ? C.rowAlt : C.card
      const values = cols.map(c => {
        if (c.key === 'name') return f.name
        if (c.key === 'vintage') return String(f.vintage)
        return c.fmt(f[c.key])
      })
      drawRow(values, { bg, firstCellTeal: true })
    })

    // Group subtotal
    const sumF = (k) => groupFunds.reduce((s, f) => s + (f[k] ?? 0), 0)
    const calledSum = sumF('totalCalled')
    const tvSum = sumF('totalValue')
    const distSum = sumF('distributed')
    const subValues = cols.map(c => {
      if (c.key === 'name') return `${group} Total`
      if (c.key === 'vintage') return ''
      if (c.key === 'netMOIC') return calledSum > 0 ? fmtX(tvSum / calledSum) : '—'
      if (c.key === 'fundSize') return fmt(sumF('fundSize'))
      if (c.key === 'totalCalled') return fmt(calledSum)
      if (c.key === 'distributed') return fmt(distSum)
      if (c.key === 'adjustedNAV') return fmt(sumF('adjustedNAV'))
      if (c.key === 'totalValue') return fmt(tvSum)
      return '—'
    })
    drawRow(subValues, { bg: C.tealDark, color: C.white, bold: true })

    y += 4 // small gap between groups
  }

  // Grand total
  const totalCalled = funds.reduce((s, f) => s + f.totalCalled, 0)
  const totalValue = funds.reduce((s, f) => s + f.totalValue, 0)
  const gtValues = cols.map(c => {
    if (c.key === 'name') return 'TOTAL PORTFOLIO'
    if (c.key === 'vintage') return ''
    if (c.key === 'netMOIC') return totalCalled > 0 ? fmtX(totalValue / totalCalled) : '—'
    if (c.key === 'fundSize') return fmt(funds.reduce((s, f) => s + f.fundSize, 0))
    if (c.key === 'totalCalled') return fmt(totalCalled)
    if (c.key === 'distributed') return fmt(funds.reduce((s, f) => s + f.distributed, 0))
    if (c.key === 'adjustedNAV') return fmt(funds.reduce((s, f) => s + f.adjustedNAV, 0))
    if (c.key === 'totalValue') return fmt(totalValue)
    return '—'
  })
  drawRow(gtValues, { bg: C.tealDeep, color: C.white, bold: true, height: 34, fontSize: 15 })

  // Footer
  out.push(`<text x="${PAD}" y="${H - 24}" font-family="${FONT}" font-size="11" fill="${C.textMid}" opacity="0.7">All figures in USD millions · IRR / MOIC pending Metrics connection · Past performance is not indicative of future results.</text>`)

  out.push('</svg>')
  return out.join('\n')
}

// ─── PPTX assembly ───────────────────────────────────────────────────────────

async function buildPptx(svgString, quarter, displayDate) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.333" x 7.5"
  pptx.title = `Mubadala Capital — All Funds ${quarter}`
  pptx.author = 'Mubadala Capital'

  const slide = pptx.addSlide()
  slide.background = { color: '0a1f1f' }

  // Embed SVG as base64 data URL (PowerPoint 2016+ supports SVG)
  const svgBase64 = Buffer.from(svgString).toString('base64')
  slide.addImage({
    data: `data:image/svg+xml;base64,${svgBase64}`,
    x: 0, y: 0, w: 13.333, h: 7.5,
  })

  return pptx
}

// ─── Main ────────────────────────────────────────────────────────────────────

const dateArg = process.argv[2] // e.g. "12/31/2024"
const { funds, reportingDate, quarter } = getData(dateArg)
console.log(`✓ Loaded ${funds.length} funds for ${quarter} (${reportingDate})`)

const svg = renderAllFundsSVG(funds, quarter, reportingDate)

// Write SVG separately for inspection
const svgOut = path.join(ROOT, 'output')
fs.mkdirSync(svgOut, { recursive: true })
const svgPath = path.join(svgOut, `AllFunds_${quarter.replace(' ', '_')}.svg`)
fs.writeFileSync(svgPath, svg)
console.log(`✓ SVG: ${svgPath}`)

const pptx = await buildPptx(svg, quarter, reportingDate)
const pptxPath = path.join(svgOut, `AllFunds_${quarter.replace(' ', '_')}.pptx`)
await pptx.writeFile({ fileName: pptxPath })
console.log(`✓ PPTX: ${pptxPath}`)
