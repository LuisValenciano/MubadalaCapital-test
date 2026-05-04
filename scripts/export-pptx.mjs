import PptxGenJS from 'pptxgenjs'
import path from 'path'
import os from 'os'

// ─── Data ────────────────────────────────────────────────────────────────────

const funds = [
  // Flagship
  { id: 'mdc-i',      name: 'MDC I',        vintage: 2017, group: 'Flagship',      fundSize: 500,  totalCalled: 482, distributed: 358, adjustedNAV: 276,  totalValue: 634,  netDPI: 0.74, netMOIC: 1.32, netIRR: 12.5, grossDPI: 0.79, grossMOIC: 1.49, grossIRR: 18.2, numUnrealizedInvestments: 4, description: "MDC I is Mubadala Capital's inaugural flagship private equity fund, focused on controlling and co-controlling equity investments in operationally intensive businesses across Brazil. The fund targets mid-market companies with strong fundamentals and significant value creation potential through operational improvements and strategic repositioning." },
  { id: 'mdc-ii',     name: 'MDC II',       vintage: 2017, group: 'Flagship',      fundSize: 750,  totalCalled: 718, distributed: 182, adjustedNAV: 822,  totalValue: 1004, netDPI: 0.25, netMOIC: 1.40, netIRR: 14.8, grossDPI: 0.28, grossMOIC: 1.58, grossIRR: 21.3, numUnrealizedInvestments: 6, description: "MDC II continues Mubadala Capital's flagship strategy with an expanded mandate, targeting high-conviction equity investments in Brazilian mid-market companies. The fund emphasises sector-specialist expertise, operational value creation, and disciplined capital deployment across healthcare, technology, and consumer sectors." },
  { id: 'mic-iii',    name: 'MIC III',      vintage: 2019, group: 'Flagship',      fundSize: 1000, totalCalled: 648, distributed: 53,  adjustedNAV: 782,  totalValue: 835,  netDPI: 0.08, netMOIC: 1.29, netIRR: 11.2, grossDPI: 0.09, grossMOIC: 1.46, grossIRR: 17.5, numUnrealizedInvestments: 8, description: "MIC III is the third vintage of Mubadala's flagship strategy, with a focus on mid-market control buyouts across Latin America. The fund benefits from Mubadala Capital's deep regional network and sector expertise, targeting companies undergoing transformational change with compelling risk-adjusted return profiles." },
  { id: 'mc-iv',      name: 'MC IV',        vintage: 2022, group: 'Flagship',      fundSize: 1500, totalCalled: 452, distributed: 22,  adjustedNAV: 512,  totalValue: 534,  netDPI: 0.05, netMOIC: 1.18, netIRR: 9.1,  grossDPI: 0.06, grossMOIC: 1.33, grossIRR: 14.5, numUnrealizedInvestments: 5, description: "MC IV is Mubadala Capital's fourth-generation flagship fund, targeting control and co-control investments in high-quality businesses across Brazil and Latin America. With a $1.5B target size, the fund focuses on resilient sectors including healthcare, financial services, and digital infrastructure, applying a rigorous operational value-creation playbook." },
  // Continuation
  { id: 'mc-i-a',     name: 'MC I-A',       vintage: 2021, group: 'Continuation',  fundSize: 300,  totalCalled: 292, distributed: 42,  adjustedNAV: 338,  totalValue: 380,  netDPI: 0.14, netMOIC: 1.30, netIRR: 10.5, grossDPI: 0.16, grossMOIC: 1.47, grossIRR: 15.8, numUnrealizedInvestments: 3, description: "MC I-A is a continuation vehicle designed to allow existing investors to maintain exposure to top-performing assets from the MDC I portfolio. The vehicle provides extended hold periods to maximise value creation from select high-conviction investments." },
  { id: 'victoria-i', name: 'Victoria I',   vintage: 2022, group: 'Continuation',  fundSize: 200,  totalCalled: 188, distributed: 16,  adjustedNAV: 212,  totalValue: 228,  netDPI: 0.09, netMOIC: 1.21, netIRR: 8.2,  grossDPI: 0.10, grossMOIC: 1.35, grossIRR: 13.1, numUnrealizedInvestments: 2, description: "Victoria I is a continuation vehicle structured to provide additional runway for select assets from the MIC III portfolio. The fund targets capital appreciation through operational excellence initiatives and strategic bolt-on acquisitions." },
  { id: 'victoria-ii',name: 'Victoria II',  vintage: 2022, group: 'Continuation',  fundSize: 250,  totalCalled: 122, distributed: 6,   adjustedNAV: 142,  totalValue: 148,  netDPI: 0.05, netMOIC: 1.21, netIRR: 9.4,  grossDPI: 0.06, grossMOIC: 1.36, grossIRR: 15.0, numUnrealizedInvestments: 2, description: "Victoria II expands the continuation vehicle strategy, focusing on high-quality assets with significant remaining value creation potential. The fund employs active portfolio management to drive operational improvements and strategic exits." },
  // Co-Investment
  { id: 'peterson',   name: 'Peterson',     vintage: 2018, group: 'Co-Investment', fundSize: 50,   totalCalled: 50,  distributed: 67,  adjustedNAV: 0,    totalValue: 67,   netDPI: 1.34, netMOIC: 1.34, netIRR: 22.5, grossDPI: 1.41, grossMOIC: 1.41, grossIRR: 28.4, numUnrealizedInvestments: 0, description: "Co-investment alongside MDC I in a leading Brazilian agribusiness platform." },
  { id: 'parking',    name: 'Parking',      vintage: 2019, group: 'Co-Investment', fundSize: 30,   totalCalled: 30,  distributed: 36,  adjustedNAV: 8,    totalValue: 44,   netDPI: 1.20, netMOIC: 1.47, netIRR: 18.3, grossDPI: 1.27, grossMOIC: 1.56, grossIRR: 23.8, numUnrealizedInvestments: 1, description: "Co-investment in a premium urban parking and mobility solutions platform." },
  { id: 'glen',       name: 'Glen',         vintage: 2019, group: 'Co-Investment', fundSize: 40,   totalCalled: 40,  distributed: 11,  adjustedNAV: 57,   totalValue: 68,   netDPI: 0.28, netMOIC: 1.70, netIRR: 26.4, grossDPI: 0.30, grossMOIC: 1.82, grossIRR: 32.1, numUnrealizedInvestments: 1, description: "Co-investment in a fast-growing specialty healthcare services group." },
  { id: 'plato',      name: 'Plato',        vintage: 2020, group: 'Co-Investment', fundSize: 25,   totalCalled: 25,  distributed: 0,   adjustedNAV: 33,   totalValue: 33,   netDPI: 0.00, netMOIC: 1.32, netIRR: 12.1, grossDPI: 0.00, grossMOIC: 1.48, grossIRR: 17.6, numUnrealizedInvestments: 1, description: "Co-investment in an EdTech platform serving K-12 and higher education markets." },
  { id: 'mirka',      name: 'Mirka',        vintage: 2021, group: 'Co-Investment', fundSize: 35,   totalCalled: 35,  distributed: 0,   adjustedNAV: 43,   totalValue: 43,   netDPI: 0.00, netMOIC: 1.23, netIRR: 9.8,  grossDPI: 0.00, grossMOIC: 1.38, grossIRR: 14.9, numUnrealizedInvestments: 1, description: "Co-investment in a consumer goods and retail distribution company." },
  { id: 'optimus',    name: 'Optimus',      vintage: 2021, group: 'Co-Investment', fundSize: 45,   totalCalled: 45,  distributed: 6,   adjustedNAV: 59,   totalValue: 65,   netDPI: 0.13, netMOIC: 1.44, netIRR: 17.8, grossDPI: 0.15, grossMOIC: 1.58, grossIRR: 23.2, numUnrealizedInvestments: 1, description: "Co-investment in a logistics and last-mile delivery technology platform." },
  { id: 'aman',       name: 'Aman',         vintage: 2021, group: 'Co-Investment', fundSize: 60,   totalCalled: 60,  distributed: 0,   adjustedNAV: 79,   totalValue: 79,   netDPI: 0.00, netMOIC: 1.32, netIRR: 14.8, grossDPI: 0.00, grossMOIC: 1.46, grossIRR: 20.3, numUnrealizedInvestments: 1, description: "Co-investment in a luxury hospitality and wellness resort group." },
  { id: 'mc-fig-group',name:'MC Fig Group', vintage: 2021, group: 'Co-Investment', fundSize: 80,   totalCalled: 80,  distributed: 21,  adjustedNAV: 92,   totalValue: 113,  netDPI: 0.26, netMOIC: 1.41, netIRR: 17.2, grossDPI: 0.29, grossMOIC: 1.56, grossIRR: 22.8, numUnrealizedInvestments: 2, description: "Co-investment in a financial services and insurance group targeting underserved segments." },
  { id: 'aquarian',   name: 'Aquarian',     vintage: 2022, group: 'Co-Investment', fundSize: 55,   totalCalled: 55,  distributed: 9,   adjustedNAV: 69,   totalValue: 78,   netDPI: 0.16, netMOIC: 1.42, netIRR: 16.5, grossDPI: 0.18, grossMOIC: 1.56, grossIRR: 21.9, numUnrealizedInvestments: 1, description: "Co-investment in a water treatment and environmental services company." },
  { id: 'lion',       name: 'Lion',         vintage: 2022, group: 'Co-Investment', fundSize: 70,   totalCalled: 66,  distributed: 0,   adjustedNAV: 83,   totalValue: 83,   netDPI: 0.00, netMOIC: 1.26, netIRR: 11.5, grossDPI: 0.00, grossMOIC: 1.40, grossIRR: 16.8, numUnrealizedInvestments: 1, description: "Co-investment in a renewable energy generation and distribution platform." },
]

const mcIVInvestments = [
  { category: 'Controlled',     company: 'Helios Health',   description: 'Multi-specialty healthcare services platform',      vintage: 2022, status: 'Unrealized',          investedCapital: 85,  realizedValue: 0,  nav: 102, totalValue: 102, grossDPI: 0.00, grossMOIC: 1.20, grossIRR: 9.8  },
  { category: 'Controlled',     company: 'Nova Logistics',  description: 'Last-mile logistics and supply chain technology',    vintage: 2022, status: 'Unrealized',          investedCapital: 110, realizedValue: 0,  nav: 138, totalValue: 138, grossDPI: 0.00, grossMOIC: 1.25, grossIRR: 12.2 },
  { category: 'Controlled',     company: 'Atlas Financial', description: 'Digital lending and financial services platform',    vintage: 2023, status: 'Unrealized',          investedCapital: 95,  realizedValue: 0,  nav: 108, totalValue: 108, grossDPI: 0.00, grossMOIC: 1.14, grossIRR: 7.5  },
  { category: 'Controlled',     company: 'Verde Energia',   description: 'Renewable energy generation and commercialisation', vintage: 2023, status: 'Unrealized',          investedCapital: 72,  realizedValue: 0,  nav: 88,  totalValue: 88,  grossDPI: 0.00, grossMOIC: 1.22, grossIRR: 11.4 },
  { category: 'Controlled',     company: 'Meridian Retail', description: 'Omnichannel retail and consumer goods distribution', vintage: 2024, status: 'Partially Realized',  investedCapital: 68,  realizedValue: 22, nav: 56,  totalValue: 78,  grossDPI: 0.32, grossMOIC: 1.15, grossIRR: 8.9  },
  { category: 'Non-Controlled', company: 'Cyan Tech',       description: 'B2B SaaS platform for enterprise resource planning', vintage: 2022, status: 'Unrealized',          investedCapital: 22,  realizedValue: 0,  nav: 30,  totalValue: 30,  grossDPI: 0.00, grossMOIC: 1.36, grossIRR: 18.5 },
  { category: 'Non-Controlled', company: 'Prata Agro',      description: 'Precision agriculture and crop inputs distribution', vintage: 2023, status: 'Unrealized',          investedCapital: 0,   realizedValue: 0,  nav: 0,   totalValue: 0,   grossDPI: 0.00, grossMOIC: 0.00, grossIRR: 0.0  },
]

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:       '0a1f1f',
  card:     '0d2626',
  card2:    '1a2e2e',
  row:      '1e3535',
  teal:     '4DB6AC',
  tealDark: '00897B',
  tealDeep: '00695C',
  border:   '2d5555',
  text:     'e2f0ef',
  textMid:  '90cac5',
  white:    'FFFFFF',
}

const fmt  = v => v === 0 ? '—' : v.toLocaleString('en-US')
const fmtX = v => v === 0 ? '—' : `${v.toFixed(2)}x`
const fmtP = v => v === 0 ? '—' : `${v.toFixed(1)}%`

// ─── Slide helpers ────────────────────────────────────────────────────────────

function addBackground(slide) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.bg } })
}

function addSlideHeader(slide, title, subtitle = '') {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: C.card } })
  slide.addText('MUBADALA CAPITAL', {
    x: 0.3, y: 0.08, w: 3, h: 0.25,
    fontSize: 7, bold: true, color: C.teal, charSpacing: 2,
  })
  slide.addText(title, {
    x: 0.3, y: 0.3, w: 8, h: 0.3,
    fontSize: 14, bold: true, color: C.white,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.3, y: 0.58, w: 8, h: 0.15,
      fontSize: 7, color: C.textMid,
    })
  }
  slide.addText('As of 31 December 2025', {
    x: 7.5, y: 0.08, w: 2.2, h: 0.2,
    fontSize: 7, color: C.textMid, align: 'right',
  })
}

function addKpiBox(slide, x, y, w, h, label, value, sub = '') {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: C.card2 }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 })
  slide.addText(label, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.18, fontSize: 6.5, color: C.textMid, bold: true, charSpacing: 1 })
  slide.addText(value, { x: x + 0.1, y: y + 0.25, w: w - 0.2, h: 0.32, fontSize: 18, bold: true, color: C.teal })
  if (sub) slide.addText(sub, { x: x + 0.1, y: y + 0.58, w: w - 0.2, h: 0.16, fontSize: 6.5, color: C.textMid })
}

// ─── Slide 1: All Funds ───────────────────────────────────────────────────────

function buildAllFundsSlide() {
  const slide = pptx.addSlide()
  addBackground(slide)
  addSlideHeader(slide, 'Private Equity Quarterly Report — All Funds', 'All figures in USD millions · Q4 2025')

  const groups = ['Flagship', 'Continuation', 'Co-Investment']
  const cols = [
    { label: 'Fund',        w: 1.1, key: null },
    { label: 'Vintage',     w: 0.55, key: 'vintage' },
    { label: 'Fund Size',   w: 0.65, key: 'fundSize' },
    { label: 'Called',      w: 0.6,  key: 'totalCalled' },
    { label: 'Distributed', w: 0.72, key: 'distributed' },
    { label: 'Adj. NAV',    w: 0.65, key: 'adjustedNAV' },
    { label: 'Total Value', w: 0.72, key: 'totalValue' },
    { label: 'Net DPI',     w: 0.55, key: 'netDPI',   fmt: fmtX },
    { label: 'Net MOIC',    w: 0.6,  key: 'netMOIC',  fmt: fmtX },
    { label: 'Net IRR',     w: 0.55, key: 'netIRR',   fmt: fmtP },
    { label: 'Gross MOIC',  w: 0.65, key: 'grossMOIC',fmt: fmtX },
    { label: 'Gross IRR',   w: 0.6,  key: 'grossIRR', fmt: fmtP },
  ]

  const startX = 0.25
  const startY = 0.82
  const rowH   = 0.205
  let   curY   = startY

  // Header row
  let curX = startX
  for (const col of cols) {
    slide.addShape(pptx.ShapeType.rect, { x: curX, y: curY, w: col.w, h: rowH, fill: { color: C.tealDark } })
    slide.addText(col.label.toUpperCase(), {
      x: curX + 0.04, y: curY + 0.04, w: col.w - 0.08, h: rowH - 0.06,
      fontSize: 5.5, bold: true, color: C.white, charSpacing: 0.5,
    })
    curX += col.w
  }
  curY += rowH

  for (const group of groups) {
    const groupFunds = funds.filter(f => f.group === group)

    // Group header
    slide.addShape(pptx.ShapeType.rect, { x: startX, y: curY, w: 9.5, h: rowH - 0.02, fill: { color: '0d4040' } })
    slide.addText(group.toUpperCase() + ' FUNDS', {
      x: startX + 0.08, y: curY + 0.03, w: 3, h: rowH - 0.08,
      fontSize: 6, bold: true, color: C.teal, charSpacing: 1,
    })
    curY += rowH - 0.02

    // Fund rows
    groupFunds.forEach((fund, i) => {
      const rowColor = i % 2 === 1 ? C.row : C.card
      let curX2 = startX
      for (const col of cols) {
        slide.addShape(pptx.ShapeType.rect, { x: curX2, y: curY, w: col.w, h: rowH, fill: { color: rowColor } })
        let val
        if (col.key === null) val = fund.name
        else if (col.fmt) val = col.fmt(fund[col.key])
        else val = fmt(fund[col.key])
        const isName = col.key === null
        slide.addText(val, {
          x: curX2 + 0.04, y: curY + 0.04, w: col.w - 0.08, h: rowH - 0.06,
          fontSize: isName ? 6.5 : 6, bold: isName, color: isName ? C.teal : C.text,
        })
        curX2 += col.w
      }
      curY += rowH
    })

    // Group subtotal
    const sub = {
      fundSize:    groupFunds.reduce((s, f) => s + f.fundSize, 0),
      totalCalled: groupFunds.reduce((s, f) => s + f.totalCalled, 0),
      distributed: groupFunds.reduce((s, f) => s + f.distributed, 0),
      adjustedNAV: groupFunds.reduce((s, f) => s + f.adjustedNAV, 0),
      totalValue:  groupFunds.reduce((s, f) => s + f.totalValue, 0),
      netDPI:      groupFunds.reduce((s, f) => s + f.distributed, 0) / groupFunds.reduce((s, f) => s + f.totalCalled, 0),
      netMOIC:     groupFunds.reduce((s, f) => s + f.totalValue, 0)  / groupFunds.reduce((s, f) => s + f.totalCalled, 0),
      netIRR:      groupFunds.reduce((s, f) => s + f.netIRR * f.totalCalled, 0) / groupFunds.reduce((s, f) => s + f.totalCalled, 0),
      grossMOIC:   groupFunds.reduce((s, f) => s + f.totalValue, 0)  / groupFunds.reduce((s, f) => s + f.totalCalled, 0) * 1.05,
      grossIRR:    groupFunds.reduce((s, f) => s + f.grossIRR * f.totalCalled, 0) / groupFunds.reduce((s, f) => s + f.totalCalled, 0),
    }
    const subVals = [
      group + ' Total',
      '',
      fmt(sub.fundSize),
      fmt(sub.totalCalled),
      fmt(sub.distributed),
      fmt(sub.adjustedNAV),
      fmt(sub.totalValue),
      fmtX(sub.netDPI),
      fmtX(sub.netMOIC),
      fmtP(sub.netIRR),
      fmtX(sub.grossMOIC),
      fmtP(sub.grossIRR),
    ]
    let curX3 = startX
    for (let i = 0; i < cols.length; i++) {
      slide.addShape(pptx.ShapeType.rect, { x: curX3, y: curY, w: cols[i].w, h: rowH, fill: { color: C.tealDark } })
      slide.addText(subVals[i], {
        x: curX3 + 0.04, y: curY + 0.04, w: cols[i].w - 0.08, h: rowH - 0.06,
        fontSize: 6, bold: true, color: C.white,
      })
      curX3 += cols[i].w
    }
    curY += rowH + 0.03
  }

  // Grand total
  const gt = {
    fundSize:    funds.reduce((s, f) => s + f.fundSize, 0),
    totalCalled: funds.reduce((s, f) => s + f.totalCalled, 0),
    distributed: funds.reduce((s, f) => s + f.distributed, 0),
    adjustedNAV: funds.reduce((s, f) => s + f.adjustedNAV, 0),
    totalValue:  funds.reduce((s, f) => s + f.totalValue, 0),
  }
  gt.netDPI   = gt.distributed / gt.totalCalled
  gt.netMOIC  = gt.totalValue  / gt.totalCalled
  gt.netIRR   = funds.reduce((s, f) => s + f.netIRR * f.totalCalled, 0) / gt.totalCalled
  gt.grossMOIC= gt.netMOIC * 1.05
  gt.grossIRR = funds.reduce((s, f) => s + f.grossIRR * f.totalCalled, 0) / gt.totalCalled

  const gtVals = ['Portfolio Total','',fmt(gt.fundSize),fmt(gt.totalCalled),fmt(gt.distributed),fmt(gt.adjustedNAV),fmt(gt.totalValue),fmtX(gt.netDPI),fmtX(gt.netMOIC),fmtP(gt.netIRR),fmtX(gt.grossMOIC),fmtP(gt.grossIRR)]
  let curX4 = startX
  for (let i = 0; i < cols.length; i++) {
    slide.addShape(pptx.ShapeType.rect, { x: curX4, y: curY, w: cols[i].w, h: rowH + 0.02, fill: { color: C.tealDeep } })
    slide.addText(gtVals[i], {
      x: curX4 + 0.04, y: curY + 0.05, w: cols[i].w - 0.08, h: rowH - 0.04,
      fontSize: 6.5, bold: true, color: C.white,
    })
    curX4 += cols[i].w
  }
}

// ─── Fund Overview Slide ──────────────────────────────────────────────────────

function buildFundOverviewSlide(fund) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addSlideHeader(slide, fund.name, `${fund.group}  ·  Vintage ${fund.vintage}  ·  Fund Size: USD ${fund.fundSize.toLocaleString()}M`)

  // Description
  slide.addShape(pptx.ShapeType.rect, { x: 0.25, y: 0.82, w: 9.5, h: 0.65, fill: { color: C.card }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 })
  slide.addText(fund.description, {
    x: 0.38, y: 0.88, w: 9.25, h: 0.55,
    fontSize: 7.5, color: C.textMid, wrap: true,
  })

  // KPI boxes
  const kpis = [
    { label: 'GROSS MOIC', value: fmtX(fund.grossMOIC) },
    { label: 'NET MOIC',   value: fmtX(fund.netMOIC)   },
    { label: 'GROSS DPI',  value: fmtX(fund.grossDPI)  },
    { label: 'NET DPI',    value: fmtX(fund.netDPI)    },
    { label: 'GROSS IRR',  value: fmtP(fund.grossIRR)  },
    { label: 'NET IRR',    value: fmtP(fund.netIRR)    },
  ]
  const kpiW = 1.55, kpiH = 0.88, kpiY = 1.58, kpiGap = 0.05
  kpis.forEach((k, i) => {
    addKpiBox(slide, 0.25 + i * (kpiW + kpiGap), kpiY, kpiW, kpiH, k.label, k.value)
  })

  // Stats row
  const stats = [
    { label: 'FUND SIZE',     value: `$${fund.fundSize.toLocaleString()}M`    },
    { label: 'TOTAL CALLED',  value: `$${fund.totalCalled.toLocaleString()}M`, sub: `${((fund.totalCalled/fund.fundSize)*100).toFixed(1)}% of size` },
    { label: 'DISTRIBUTED',   value: `$${fund.distributed.toLocaleString()}M` },
    { label: 'ADJ. NAV',      value: `$${fund.adjustedNAV.toLocaleString()}M`, sub: 'Unrealized value' },
    { label: 'TOTAL VALUE',   value: `$${fund.totalValue.toLocaleString()}M`  },
    { label: 'UNREALIZED INV',value: `${fund.numUnrealizedInvestments}`        },
  ]
  const sW = 1.55, sH = 0.75, sY = 2.56
  stats.forEach((s, i) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0.25 + i * (sW + kpiGap), y: sY, w: sW, h: sH, fill: { color: C.card }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 })
    slide.addText(s.label, { x: 0.35 + i * (sW + kpiGap), y: sY + 0.08, w: sW - 0.2, h: 0.15, fontSize: 6, bold: true, color: C.textMid, charSpacing: 1 })
    slide.addText(s.value, { x: 0.35 + i * (sW + kpiGap), y: sY + 0.22, w: sW - 0.2, h: 0.3,  fontSize: 14, bold: true, color: C.text })
    if (s.sub) slide.addText(s.sub, { x: 0.35 + i * (sW + kpiGap), y: sY + 0.55, w: sW - 0.2, h: 0.14, fontSize: 6, color: C.textMid })
  })

  // Divider
  slide.addShape(pptx.ShapeType.line, { x: 0.25, y: 3.38, w: 9.5, h: 0, line: { color: C.border, width: 0.5 } })
  slide.addText('All figures in USD millions  ·  As of 31 December 2025', {
    x: 0.25, y: 3.42, w: 9.5, h: 0.18, fontSize: 6.5, color: C.textMid,
  })
}

// ─── Schedule of Investments Slide ───────────────────────────────────────────

function buildScheduleSlide(fund) {
  const slide = pptx.addSlide()
  addBackground(slide)
  addSlideHeader(slide, `${fund.name} — Schedule of Investments`, `${fund.group}  ·  Vintage ${fund.vintage}`)

  const investments = fund.id === 'mc-iv' ? mcIVInvestments : []

  if (investments.length === 0) {
    slide.addShape(pptx.ShapeType.rect, { x: 0.25, y: 1.0, w: 9.5, h: 1.2, fill: { color: C.card }, line: { color: C.border, width: 0.5 }, rectRadius: 0.08 })
    slide.addText('Schedule of Investments data not available for this fund.', {
      x: 0.5, y: 1.3, w: 9, h: 0.6, fontSize: 11, color: C.textMid, align: 'center',
    })
    return
  }

  const cols = [
    { label: 'Company',        w: 1.3  },
    { label: 'Description',    w: 1.9  },
    { label: 'Vintage',        w: 0.55 },
    { label: 'Status',         w: 0.9  },
    { label: 'Invested Cap.',  w: 0.75 },
    { label: 'Realized Val.',  w: 0.75 },
    { label: 'NAV',            w: 0.65 },
    { label: 'Total Value',    w: 0.72 },
    { label: 'Gross DPI',      w: 0.6  },
    { label: 'Gross MOIC',     w: 0.65 },
    { label: 'Gross IRR',      w: 0.62 },
  ]

  const startX = 0.25, startY = 0.82, rowH = 0.215
  let curY = startY

  // Header
  let curX = startX
  for (const col of cols) {
    slide.addShape(pptx.ShapeType.rect, { x: curX, y: curY, w: col.w, h: rowH, fill: { color: C.tealDark } })
    slide.addText(col.label.toUpperCase(), {
      x: curX + 0.04, y: curY + 0.05, w: col.w - 0.08, h: rowH - 0.07,
      fontSize: 5.5, bold: true, color: C.white, charSpacing: 0.3,
    })
    curX += col.w
  }
  curY += rowH

  const categories = ['Controlled', 'Non-Controlled']
  for (const cat of categories) {
    const catInvs = investments.filter(i => i.category === cat)
    if (catInvs.length === 0) continue

    // Category header
    slide.addShape(pptx.ShapeType.rect, { x: startX, y: curY, w: 9.44, h: rowH - 0.03, fill: { color: '0d4040' } })
    slide.addText(cat.toUpperCase() + ' INVESTMENTS', {
      x: startX + 0.08, y: curY + 0.03, w: 4, h: rowH - 0.08,
      fontSize: 6, bold: true, color: C.teal, charSpacing: 1,
    })
    curY += rowH - 0.03

    catInvs.forEach((inv, idx) => {
      const rowColor = idx % 2 === 1 ? C.row : C.card
      const vals = [
        inv.company, inv.description, String(inv.vintage), inv.status,
        fmt(inv.investedCapital), fmt(inv.realizedValue), fmt(inv.nav),
        fmt(inv.totalValue), fmtX(inv.grossDPI), fmtX(inv.grossMOIC), fmtP(inv.grossIRR),
      ]
      let cx = startX
      vals.forEach((val, ci) => {
        slide.addShape(pptx.ShapeType.rect, { x: cx, y: curY, w: cols[ci].w, h: rowH, fill: { color: rowColor } })
        const isName = ci === 0
        slide.addText(val, {
          x: cx + 0.04, y: curY + 0.04, w: cols[ci].w - 0.08, h: rowH - 0.06,
          fontSize: ci <= 1 ? 6 : 6.5, bold: isName, color: isName ? C.teal : C.text,
        })
        cx += cols[ci].w
      })
      curY += rowH
    })

    // Subtotal
    const subInv = catInvs.reduce((s, i) => ({
      investedCapital: s.investedCapital + i.investedCapital,
      realizedValue:   s.realizedValue   + i.realizedValue,
      nav:             s.nav             + i.nav,
      totalValue:      s.totalValue      + i.totalValue,
    }), { investedCapital: 0, realizedValue: 0, nav: 0, totalValue: 0 })
    const subDPI  = subInv.investedCapital ? subInv.realizedValue / subInv.investedCapital : 0
    const subMOIC = subInv.investedCapital ? subInv.totalValue    / subInv.investedCapital : 0
    const subVals = [cat + ' Total','','','',fmt(subInv.investedCapital),fmt(subInv.realizedValue),fmt(subInv.nav),fmt(subInv.totalValue),fmtX(subDPI),fmtX(subMOIC),'']
    let cx2 = startX
    for (let i = 0; i < cols.length; i++) {
      slide.addShape(pptx.ShapeType.rect, { x: cx2, y: curY, w: cols[i].w, h: rowH, fill: { color: C.tealDark } })
      slide.addText(subVals[i], {
        x: cx2 + 0.04, y: curY + 0.04, w: cols[i].w - 0.08, h: rowH - 0.06,
        fontSize: 6, bold: true, color: C.white,
      })
      cx2 += cols[i].w
    }
    curY += rowH + 0.04
  }

  // Grand total
  const gt = investments.reduce((s, i) => ({
    investedCapital: s.investedCapital + i.investedCapital,
    realizedValue:   s.realizedValue   + i.realizedValue,
    nav:             s.nav             + i.nav,
    totalValue:      s.totalValue      + i.totalValue,
  }), { investedCapital: 0, realizedValue: 0, nav: 0, totalValue: 0 })
  const gtDPI  = gt.investedCapital ? gt.realizedValue / gt.investedCapital : 0
  const gtMOIC = gt.investedCapital ? gt.totalValue    / gt.investedCapital : 0
  const gtVals = ['Grand Total','','','',fmt(gt.investedCapital),fmt(gt.realizedValue),fmt(gt.nav),fmt(gt.totalValue),fmtX(gtDPI),fmtX(gtMOIC),'']
  let cx3 = startX
  for (let i = 0; i < cols.length; i++) {
    slide.addShape(pptx.ShapeType.rect, { x: cx3, y: curY, w: cols[i].w, h: rowH + 0.02, fill: { color: C.tealDeep } })
    slide.addText(gtVals[i], {
      x: cx3 + 0.04, y: curY + 0.05, w: cols[i].w - 0.08, h: rowH - 0.04,
      fontSize: 6.5, bold: true, color: C.white,
    })
    cx3 += cols[i].w
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.title  = 'Mubadala Capital — PE Dashboard Q4 2025'
pptx.author = 'Mubadala Capital'

buildAllFundsSlide()

for (const fund of funds) {
  buildFundOverviewSlide(fund)
  buildScheduleSlide(fund)
}

const outPath = path.join(os.homedir(), 'Desktop', 'MubadalaCapital_PE_Q4_2025.pptx')
await pptx.writeFile({ fileName: outPath })
console.log(`✓ Saved: ${outPath}`)
