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
  const accumulate = (id, tv, ti, real, irr = null) => {
    if (!id) return
    if (!agg.has(id)) agg.set(id, { tv: 0, ti: 0, real: 0, irrSum: 0, irrTi: 0 })
    const e = agg.get(id)
    e.tv += tv; e.ti += ti; e.real += real
    if (irr != null && ti > 0) { e.irrSum += irr * ti; e.irrTi += ti }
  }
  for (const r of parseCSV('SOI Direct.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Total Income']) + toNum(r['Proceeds'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Total Value']), toNum(r['Investments']), real)
  }
  for (const r of parseCSV('SOI Fund.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Realized'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Adjusted NAV']) + real, toNum(r['Total Called']), real)
  }
  for (const r of parseCSV('SOI CIV Direct.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Total Income']) + toNum(r['Proceeds'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Total Value']), toNum(r['Investments']), real, toNum(r['Gross IRR']))
  }
  for (const r of parseCSV('SOI CIV Fund.csv').filter(r => r['Reporting Date'] === date)) {
    const real = toNum(r['Realized'])
    accumulate(r['MC2025Q1FundID'], toNum(r['Adjusted NAV']) + real, toNum(r['Total Called']), real, toNum(r['IRR']))
  }
  const result = new Map()
  for (const [id, { tv, ti, real, irrSum, irrTi }] of agg) {
    if (ti > 0) result.set(id, {
      grossMOIC: tv / ti,
      grossDPI: real / ti,
      grossIRR: irrTi > 0 ? (irrSum / irrTi) * 100 : null,
    })
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
        grossIRR:  f['Grouping'] === 'Co-Investment' ? (soiData?.grossIRR ?? null) : (ir?.grossIRR ?? null),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { funds, reportingDate, quarter: quarterLabel(reportingDate) }
}

function getFundDetailData(fundId, dateArg) {
  const rows = parseCSV('Managed Funds.csv').filter(r => r['MC2025Q1FundID'] === fundId)
  const dates = [...new Set(rows.map(r => r['Reporting Date']))].sort((a, b) => dateKey(b) - dateKey(a))
  const currentDate = dateArg && dates.includes(dateArg) ? dateArg : dates[0]
  const idx = dates.indexOf(currentDate)
  const prevDate = dates[idx + 1] ?? null
  const sumF = (date, col) => rows.filter(r => r['Reporting Date'] === date).reduce((s, r) => s + toNum(r[col]), 0)
  const curr = {
    commitment:  sumF(currentDate, 'Commitment'),
    called:      sumF(currentDate, 'Called'),
    distributed: sumF(currentDate, 'Distributed'),
    remaining:   sumF(currentDate, 'Remaining'),
    nav:         sumF(currentDate, 'Adjusted NAV'),
  }
  const prev = prevDate ? {
    called:      sumF(prevDate, 'Called'),
    distributed: sumF(prevDate, 'Distributed'),
    nav:         sumF(prevDate, 'Adjusted NAV'),
  } : null
  return { curr, prev, currentDate, prevDate }
}

// ─── Theme (PptxGenJS uses hex without #) — Light mode matching Power BI ─────

const C = {
  bg: 'FFFFFF',           // WHITE
  row: 'FFFFFF',          // WHITE
  rowAlt: 'ECE9DA',       // brand BEIGE
  colHeaderBg: '7AC4BD',  // brand TEAL — column header background
  colHeaderTxt: 'FFFFFF', // WHITE text on teal header
  groupBar: '7AC4BD',     // brand TEAL — group bars
  totalBar: '042A2B',     // brand DEEP TEAL
  teal: '7AC4BD',         // brand TEAL — accents, subtitle, lines
  border: 'D4CDBC',       // brand STONE
  text: '000000',         // brand BLACK
  textMid: '042A2B',      // brand DEEP TEAL
  white: 'FFFFFF',
  black: '000000',        // brand BLACK
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
    { key: 'vintage',     label: 'Vintage',      w: 0.75, align: 'left' },
    { key: 'fundSize',    label: 'Fund Size',    w: 0.93, align: 'right', fmt },
    { key: 'totalCalled', label: 'Total Called', w: 1.03, align: 'right', fmt },
    { key: 'distributed', label: 'Distributed',  w: 0.93, align: 'right', fmt },
    { key: 'adjustedNAV', label: 'Adjusted Nav', w: 1.15, align: 'right', fmt },
    { key: 'totalValue',  label: 'Total Value',  w: 1.00, align: 'right', fmt, bold: true },
    { key: 'netDPI',      label: 'Net DPI',      w: 0.82, align: 'right', fmt: fmtX },
    { key: 'netMOIC',     label: 'Net MOIC',     w: 0.88, align: 'right', fmt: fmtX, bold: true },
    { key: 'netIRR',      label: 'Net IRR',      w: 0.77, align: 'right', fmt: fmtP },
    { key: 'grossDPI',    label: 'Gross DPI',    w: 0.88, align: 'right', fmt: fmtX },
    { key: 'grossMOIC',   label: 'Gross MOIC',   w: 0.97, align: 'right', fmt: fmtX, bold: true },
    { key: 'grossIRR',    label: 'Gross IRR',    w: 0.92, align: 'right', fmt: fmtP },
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

// ─── Fund detail slide ───────────────────────────────────────────────────────

function buildFundDetailSlide(pptx, fund, detail, quarter, reportingDate) {
  const slide = pptx.addSlide()
  const txt = (content, opts) => slide.addText(content, { fontFace: 'D-DIN', ...opts })
  const fmtDate = s => { const [m, d, y] = s.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }

  // Background
  slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{color:C.bg}, line:{type:'none'} })

  // ─── Header ─────────────────────────────────────────────────────────────
  slide.addImage({ path: path.join(ROOT, 'public', 'Mubadala Logo_Stacked Center Aligned_Black.jpg'), x:0.15, y:0.26, w:1.60, h:0.42 })
  slide.addShape(pptx.ShapeType.line, { x:1.90, y:0.26, w:0, h:0.52, line:{color:C.border, width:0.75} })
  txt(fund.name, { x:1.94, y:0.14, w:7.00, h:0.42, fontSize:22, bold:true, color:C.black })
  txt(`${fund.vintage} VINTAGE (USD in Millions)`, { x:1.94, y:0.55, w:7.00, h:0.24, fontSize:11, bold:true, color:C.teal })
  slide.addShape(pptx.ShapeType.line, { x:9.10, y:0.26, w:0, h:0.52, line:{color:C.border, width:0.75} })
  txt(fund.group, { x:9.20, y:0.30, w:2.10, h:0.30, fontSize:13, bold:true, color:C.black, align:'center' })
  txt(fmtDate(reportingDate), { x:11.50, y:0.30, w:1.65, h:0.30, fontSize:11, color:C.black, align:'right' })
  slide.addShape(pptx.ShapeType.line, { x:0.15, y:0.90, w:13.0, h:0, line:{color:C.teal, width:1.5} })

  const { curr, prev, prevDate } = detail
  const toM = v => v / M
  const commitment  = toM(curr.commitment)
  const called      = toM(curr.called)
  const distributed = toM(curr.distributed)
  const remaining   = toM(curr.remaining)
  const pctContrib  = commitment > 0 ? called / commitment * 100 : 0
  const pctReturn   = called > 0 ? distributed / called * 100 : 0

  const axisY   = 6.90
  const drawBar = (bx, bh, by, bw, color) =>
    slide.addShape(pptx.ShapeType.rect, { x:bx, y:by, w:bw, h:Math.max(bh, 0.02), fill:{color}, line:{type:'none'} })

  // ─── Chart 1: Capital Activity ──────────────────────────────────────────
  const c1X = 0.25, c1Y = 1.10, c1W = 5.75
  const unusedVal = Math.max(remaining, 0)
  const barAreaH1 = axisY - (c1Y + 1.10)
  const maxV1 = Math.max(commitment, called, distributed, unusedVal, 1)
  const scaleH1 = v => (v / maxV1) * barAreaH1

  txt('Capital Activity', { x:c1X, y:c1Y, w:c1W, h:0.35, fontSize:16, bold:true, color:C.teal })
  slide.addShape(pptx.ShapeType.line, { x:c1X, y:c1Y+0.38, w:c1W, h:0, line:{color:C.teal, width:0.75} })

  const badgeH = 0.27, badgeW = 1.72, badgeY = c1Y + 0.52
  // center two badges within the chart width: 3 equal gaps around 2 badges
  const badgeGap = (c1W - 2 * badgeW) / 3
  ;[
    [`${pctContrib.toFixed(1)}% Contributed`, c1X + badgeGap],
    [`${pctReturn.toFixed(1)}% Returned`,     c1X + badgeGap * 2 + badgeW],
  ].forEach(([label, bx]) => {
    slide.addShape(pptx.ShapeType.roundRect, { x:bx, y:badgeY, w:badgeW, h:badgeH, fill:{color:C.teal}, line:{type:'none'}, rectRadius:0.5 })
    txt(label, { x:bx, y:badgeY+0.01, w:badgeW, h:badgeH-0.02, fontSize:8.5, bold:true, color:C.white, align:'center', valign:'middle' })
  })
  const bars1 = [
    { label:'Commitment',    value:commitment,  color:C.teal },
    { label:'Contributions', value:called,      color:C.textMid },
    { label:'Distributions', value:distributed, color:C.textMid },
    { label:'Unused',        value:unusedVal,   color:C.teal },
  ]
  const barW1 = 0.75
  const gap1 = (c1W - bars1.length * barW1) / (bars1.length + 1)
  bars1.forEach((b, i) => {
    const bx = c1X + gap1 * (i + 1) + barW1 * i
    const bh = scaleH1(b.value)
    const by = axisY - bh
    drawBar(bx, bh, by, barW1, b.color)
    txt(Math.round(b.value).toLocaleString('en-US'), { x:bx-0.20, y:by-0.23, w:barW1+0.40, h:0.22, fontSize:9, color:C.black, align:'center' })
    txt(b.label, { x:bx-0.20, y:axisY+0.06, w:barW1+0.40, h:0.22, fontSize:8.5, color:C.black, align:'center' })
  })
  slide.addShape(pptx.ShapeType.line, { x:c1X, y:axisY, w:c1W, h:0, line:{color:'D0D0D0', width:0.5} })

  // ─── Vertical divider ───────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.line, { x:6.25, y:1.05, w:0, h:6.20, line:{color:C.border, width:0.75} })

  // ─── Chart 2: Partner's Capital Evolution – QTD ─────────────────────────
  if (!prev) return

  const navPrev     = toM(prev.nav)
  const navCurr     = toM(curr.nav)
  const deltaCalled = toM(curr.called - prev.called)
  const deltaDist   = toM(curr.distributed - prev.distributed)
  const pnl = (navCurr - navPrev) - deltaCalled - deltaDist

  const c2X = 6.50, c2Y = 1.10, c2W = 6.60
  const barAreaH2 = axisY - (c2Y + 0.75)
  const maxV2 = Math.max(navPrev, navCurr, 1)
  const scaleH2 = v => (Math.abs(v) / maxV2) * barAreaH2

  txt("Partner's Capital Evolution – QTD", { x:c2X, y:c2Y, w:c2W, h:0.35, fontSize:16, bold:true, color:C.teal })
  slide.addShape(pptx.ShapeType.line, { x:c2X, y:c2Y+0.38, w:c2W, h:0, line:{color:C.teal, width:0.75} })

  // Floating waterfall: first/last bars from baseline; intermediate bars float
  const wfBars = [
    { label:fmtDate(prevDate),      value:navPrev,     baseline:true,  color:C.teal },
    { label:'Call',                 value:deltaCalled, baseline:false, color:C.textMid },
    { label:'Distributed',          value:deltaDist,   baseline:false, color:C.textMid },
    { label:'P&L',                  value:pnl,         baseline:false, color:pnl >= 0 ? C.teal : 'F37D44' },
    { label:fmtDate(reportingDate), value:navCurr,     baseline:true,  color:C.textMid },
  ]
  const barW2 = 0.75
  const gap2 = (c2W - wfBars.length * barW2) / (wfBars.length + 1)
  const barXs2 = wfBars.map((_, i) => c2X + gap2 * (i + 1) + barW2 * i)

  let accY = axisY
  const connectors = []

  wfBars.forEach((b, i) => {
    const bx = barXs2[i]
    let bh, by
    if (b.baseline) {
      bh = Math.max(scaleH2(b.value), 0.02)
      by = axisY - bh
      accY = by
    } else {
      const h = scaleH2(Math.abs(b.value))
      bh = Math.max(h, Math.abs(b.value) > 0.5 ? 0.04 : 0.02)
      if (b.value >= 0) { by = accY - bh; accY = by }
      else              { by = accY;      accY = accY + bh }
    }
    drawBar(bx, bh, by, barW2, b.color)
    const absVal = Math.abs(b.value)
    const valStr = absVal < 0.5 ? '0' : `${b.value < 0 ? '(' : ''}${Math.round(absVal).toLocaleString('en-US')}${b.value < 0 ? ')' : ''}`
    txt(valStr, { x:bx-0.20, y:by-0.23, w:barW2+0.40, h:0.22, fontSize:9, color:C.black, align:'center' })
    txt(b.label, { x:bx-0.25, y:axisY+0.06, w:barW2+0.50, h:0.22, fontSize:8, color:C.black, align:'center' })
    if (i < wfBars.length - 1) connectors.push({ x1:bx+barW2, x2:barXs2[i+1], y:accY })
  })
  connectors.forEach(({ x1, x2, y }) =>
    slide.addShape(pptx.ShapeType.line, { x:x1, y, w:x2-x1, h:0, line:{color:C.border, width:0.5} })
  )
  slide.addShape(pptx.ShapeType.line, { x:c2X, y:axisY, w:c2W, h:0, line:{color:'D0D0D0', width:0.5} })

  // Footer teal line
  slide.addShape(pptx.ShapeType.line, { x:0.15, y:7.42, w:13.0, h:0, line:{color:C.teal, width:1.5} })
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

const helios = funds.find(f => f.id === 'MC-PE-4')
if (helios) {
  const heliosDetail = getFundDetailData('MC-PE-4', reportingDate)
  buildFundDetailSlide(pptx, helios, heliosDetail, quarter, reportingDate)
  console.log(`✓ Fund detail slide: ${helios.name} (prev quarter: ${heliosDetail.prevDate ?? 'N/A'})`)
}

const outDir = path.join(ROOT, 'output')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `AllFunds_Native_${quarter.replace(' ', '_')}.pptx`)
await pptx.writeFile({ fileName: outPath })
console.log(`✓ PPTX (native shapes): ${outPath}`)
