export type FundGroup = 'Flagship' | 'Continuation' | 'Co-Investment'

export interface Fund {
  id: string
  name: string
  vintage: number
  group: FundGroup
  fundSize: number       // $M
  totalCalled: number
  distributed: number
  adjustedNAV: number
  totalValue: number
  netDPI: number
  netMOIC: number
  netIRR: number        // %
  grossDPI: number
  grossMOIC: number
  grossIRR: number      // %
  description: string
  numUnrealizedInvestments: number
}

export const funds: Fund[] = [
  // ─── Flagship ───────────────────────────────────────────────────────────────
  {
    id: 'mdc-i',
    name: 'MDC I',
    vintage: 2017,
    group: 'Flagship',
    fundSize: 500,
    totalCalled: 482,
    distributed: 358,
    adjustedNAV: 276,
    totalValue: 634,
    netDPI: 0.74,
    netMOIC: 1.32,
    netIRR: 12.5,
    grossDPI: 0.79,
    grossMOIC: 1.49,
    grossIRR: 18.2,
    description:
      'MDC I is Mubadala Capital\'s inaugural flagship private equity fund, focused on controlling and co-controlling equity investments in operationally intensive businesses across Brazil. The fund targets mid-market companies with strong fundamentals and significant value creation potential through operational improvements and strategic repositioning.',
    numUnrealizedInvestments: 4,
  },
  {
    id: 'mdc-ii',
    name: 'MDC II',
    vintage: 2017,
    group: 'Flagship',
    fundSize: 750,
    totalCalled: 718,
    distributed: 182,
    adjustedNAV: 822,
    totalValue: 1004,
    netDPI: 0.25,
    netMOIC: 1.40,
    netIRR: 14.8,
    grossDPI: 0.28,
    grossMOIC: 1.58,
    grossIRR: 21.3,
    description:
      'MDC II continues Mubadala Capital\'s flagship strategy with an expanded mandate, targeting high-conviction equity investments in Brazilian mid-market companies. The fund emphasises sector-specialist expertise, operational value creation, and disciplined capital deployment across healthcare, technology, and consumer sectors.',
    numUnrealizedInvestments: 6,
  },
  {
    id: 'mic-iii',
    name: 'MIC III',
    vintage: 2019,
    group: 'Flagship',
    fundSize: 1000,
    totalCalled: 648,
    distributed: 53,
    adjustedNAV: 782,
    totalValue: 835,
    netDPI: 0.08,
    netMOIC: 1.29,
    netIRR: 11.2,
    grossDPI: 0.09,
    grossMOIC: 1.46,
    grossIRR: 17.5,
    description:
      'MIC III is the third vintage of Mubadala\'s flagship strategy, with a focus on mid-market control buyouts across Latin America. The fund benefits from Mubadala Capital\'s deep regional network and sector expertise, targeting companies undergoing transformational change with compelling risk-adjusted return profiles.',
    numUnrealizedInvestments: 8,
  },
  {
    id: 'mc-iv',
    name: 'MC IV',
    vintage: 2022,
    group: 'Flagship',
    fundSize: 1500,
    totalCalled: 452,
    distributed: 22,
    adjustedNAV: 512,
    totalValue: 534,
    netDPI: 0.05,
    netMOIC: 1.18,
    netIRR: 9.1,
    grossDPI: 0.06,
    grossMOIC: 1.33,
    grossIRR: 14.5,
    description:
      'MC IV is Mubadala Capital\'s fourth-generation flagship fund, targeting control and co-control investments in high-quality businesses across Brazil and Latin America. With a $1.5B target size, the fund focuses on resilient sectors including healthcare, financial services, and digital infrastructure, applying a rigorous operational value-creation playbook.',
    numUnrealizedInvestments: 5,
  },
  // ─── Continuation ───────────────────────────────────────────────────────────
  {
    id: 'mc-i-a',
    name: 'MC I-A',
    vintage: 2021,
    group: 'Continuation',
    fundSize: 300,
    totalCalled: 292,
    distributed: 42,
    adjustedNAV: 338,
    totalValue: 380,
    netDPI: 0.14,
    netMOIC: 1.30,
    netIRR: 10.5,
    grossDPI: 0.16,
    grossMOIC: 1.47,
    grossIRR: 15.8,
    description:
      'MC I-A is a continuation vehicle designed to allow existing investors to maintain exposure to top-performing assets from the MDC I portfolio. The vehicle provides extended hold periods to maximise value creation from select high-conviction investments.',
    numUnrealizedInvestments: 3,
  },
  {
    id: 'victoria-i',
    name: 'Victoria I',
    vintage: 2022,
    group: 'Continuation',
    fundSize: 200,
    totalCalled: 188,
    distributed: 16,
    adjustedNAV: 212,
    totalValue: 228,
    netDPI: 0.09,
    netMOIC: 1.21,
    netIRR: 8.2,
    grossDPI: 0.10,
    grossMOIC: 1.35,
    grossIRR: 13.1,
    description:
      'Victoria I is a continuation vehicle structured to provide additional runway for select assets from the MIC III portfolio. The fund targets capital appreciation through operational excellence initiatives and strategic bolt-on acquisitions.',
    numUnrealizedInvestments: 2,
  },
  {
    id: 'victoria-ii',
    name: 'Victoria II',
    vintage: 2022,
    group: 'Continuation',
    fundSize: 250,
    totalCalled: 122,
    distributed: 6,
    adjustedNAV: 142,
    totalValue: 148,
    netDPI: 0.05,
    netMOIC: 1.21,
    netIRR: 9.4,
    grossDPI: 0.06,
    grossMOIC: 1.36,
    grossIRR: 15.0,
    description:
      'Victoria II expands the continuation vehicle strategy, focusing on high-quality assets with significant remaining value creation potential. The fund employs active portfolio management to drive operational improvements and strategic exits.',
    numUnrealizedInvestments: 2,
  },
  // ─── Co-Investment ──────────────────────────────────────────────────────────
  {
    id: 'peterson',
    name: 'Peterson',
    vintage: 2018,
    group: 'Co-Investment',
    fundSize: 50,
    totalCalled: 50,
    distributed: 67,
    adjustedNAV: 0,
    totalValue: 67,
    netDPI: 1.34,
    netMOIC: 1.34,
    netIRR: 22.5,
    grossDPI: 1.41,
    grossMOIC: 1.41,
    grossIRR: 28.4,
    description: 'Co-investment alongside MDC I in a leading Brazilian agribusiness platform.',
    numUnrealizedInvestments: 0,
  },
  {
    id: 'parking',
    name: 'Parking',
    vintage: 2019,
    group: 'Co-Investment',
    fundSize: 30,
    totalCalled: 30,
    distributed: 36,
    adjustedNAV: 8,
    totalValue: 44,
    netDPI: 1.20,
    netMOIC: 1.47,
    netIRR: 18.3,
    grossDPI: 1.27,
    grossMOIC: 1.56,
    grossIRR: 23.8,
    description: 'Co-investment in a premium urban parking and mobility solutions platform.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'glen',
    name: 'Glen',
    vintage: 2019,
    group: 'Co-Investment',
    fundSize: 40,
    totalCalled: 40,
    distributed: 11,
    adjustedNAV: 57,
    totalValue: 68,
    netDPI: 0.28,
    netMOIC: 1.70,
    netIRR: 26.4,
    grossDPI: 0.30,
    grossMOIC: 1.82,
    grossIRR: 32.1,
    description: 'Co-investment in a fast-growing specialty healthcare services group.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'plato',
    name: 'Plato',
    vintage: 2020,
    group: 'Co-Investment',
    fundSize: 25,
    totalCalled: 25,
    distributed: 0,
    adjustedNAV: 33,
    totalValue: 33,
    netDPI: 0.00,
    netMOIC: 1.32,
    netIRR: 12.1,
    grossDPI: 0.00,
    grossMOIC: 1.48,
    grossIRR: 17.6,
    description: 'Co-investment in an EdTech platform serving K-12 and higher education markets.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'mirka',
    name: 'Mirka',
    vintage: 2021,
    group: 'Co-Investment',
    fundSize: 35,
    totalCalled: 35,
    distributed: 0,
    adjustedNAV: 43,
    totalValue: 43,
    netDPI: 0.00,
    netMOIC: 1.23,
    netIRR: 9.8,
    grossDPI: 0.00,
    grossMOIC: 1.38,
    grossIRR: 14.9,
    description: 'Co-investment in a consumer goods and retail distribution company.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'optimus',
    name: 'Optimus',
    vintage: 2021,
    group: 'Co-Investment',
    fundSize: 45,
    totalCalled: 45,
    distributed: 6,
    adjustedNAV: 59,
    totalValue: 65,
    netDPI: 0.13,
    netMOIC: 1.44,
    netIRR: 17.8,
    grossDPI: 0.15,
    grossMOIC: 1.58,
    grossIRR: 23.2,
    description: 'Co-investment in a logistics and last-mile delivery technology platform.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'aman',
    name: 'Aman',
    vintage: 2021,
    group: 'Co-Investment',
    fundSize: 60,
    totalCalled: 60,
    distributed: 0,
    adjustedNAV: 79,
    totalValue: 79,
    netDPI: 0.00,
    netMOIC: 1.32,
    netIRR: 14.8,
    grossDPI: 0.00,
    grossMOIC: 1.46,
    grossIRR: 20.3,
    description: 'Co-investment in a luxury hospitality and wellness resort group.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'mc-fig-group',
    name: 'MC Fig Group',
    vintage: 2021,
    group: 'Co-Investment',
    fundSize: 80,
    totalCalled: 80,
    distributed: 21,
    adjustedNAV: 92,
    totalValue: 113,
    netDPI: 0.26,
    netMOIC: 1.41,
    netIRR: 17.2,
    grossDPI: 0.29,
    grossMOIC: 1.56,
    grossIRR: 22.8,
    description: 'Co-investment in a financial services and insurance group targeting underserved segments.',
    numUnrealizedInvestments: 2,
  },
  {
    id: 'aquarian',
    name: 'Aquarian',
    vintage: 2022,
    group: 'Co-Investment',
    fundSize: 55,
    totalCalled: 55,
    distributed: 9,
    adjustedNAV: 69,
    totalValue: 78,
    netDPI: 0.16,
    netMOIC: 1.42,
    netIRR: 16.5,
    grossDPI: 0.18,
    grossMOIC: 1.56,
    grossIRR: 21.9,
    description: 'Co-investment in a water treatment and environmental services company.',
    numUnrealizedInvestments: 1,
  },
  {
    id: 'lion',
    name: 'Lion',
    vintage: 2022,
    group: 'Co-Investment',
    fundSize: 70,
    totalCalled: 66,
    distributed: 0,
    adjustedNAV: 83,
    totalValue: 83,
    netDPI: 0.00,
    netMOIC: 1.26,
    netIRR: 11.5,
    grossDPI: 0.00,
    grossMOIC: 1.40,
    grossIRR: 16.8,
    description: 'Co-investment in a renewable energy generation and distribution platform.',
    numUnrealizedInvestments: 1,
  },
]

export const getFundById = (id: string) => funds.find((f) => f.id === id)

// ─── MC IV Schedule of Investments ─────────────────────────────────────────

export type InvestmentStatus = 'Realized' | 'Partially Realized' | 'Unrealized'

export interface Investment {
  id: string
  fundId: string
  category: 'Controlled' | 'Non-Controlled'
  company: string
  description: string
  vintage: number
  status: InvestmentStatus
  investedCapital: number
  realizedValue: number
  nav: number
  totalValue: number
  grossDPI: number
  grossMOIC: number
  grossIRR: number
}

export const mcIVInvestments: Investment[] = [
  // Controlled
  {
    id: 'helios',
    fundId: 'mc-iv',
    category: 'Controlled',
    company: 'Helios Health',
    description: 'Multi-specialty healthcare services platform',
    vintage: 2022,
    status: 'Unrealized',
    investedCapital: 85,
    realizedValue: 0,
    nav: 102,
    totalValue: 102,
    grossDPI: 0.00,
    grossMOIC: 1.20,
    grossIRR: 9.8,
  },
  {
    id: 'nova',
    fundId: 'mc-iv',
    category: 'Controlled',
    company: 'Nova Logistics',
    description: 'Last-mile logistics and supply chain technology',
    vintage: 2022,
    status: 'Unrealized',
    investedCapital: 110,
    realizedValue: 0,
    nav: 138,
    totalValue: 138,
    grossDPI: 0.00,
    grossMOIC: 1.25,
    grossIRR: 12.2,
  },
  {
    id: 'atlas',
    fundId: 'mc-iv',
    category: 'Controlled',
    company: 'Atlas Financial',
    description: 'Digital lending and financial services platform',
    vintage: 2023,
    status: 'Unrealized',
    investedCapital: 95,
    realizedValue: 0,
    nav: 108,
    totalValue: 108,
    grossDPI: 0.00,
    grossMOIC: 1.14,
    grossIRR: 7.5,
  },
  {
    id: 'verde',
    fundId: 'mc-iv',
    category: 'Controlled',
    company: 'Verde Energia',
    description: 'Renewable energy generation and commercialisation',
    vintage: 2023,
    status: 'Unrealized',
    investedCapital: 72,
    realizedValue: 0,
    nav: 88,
    totalValue: 88,
    grossDPI: 0.00,
    grossMOIC: 1.22,
    grossIRR: 11.4,
  },
  {
    id: 'meridian',
    fundId: 'mc-iv',
    category: 'Controlled',
    company: 'Meridian Retail',
    description: 'Omnichannel retail and consumer goods distribution',
    vintage: 2024,
    status: 'Unrealized',
    investedCapital: 68,
    realizedValue: 22,
    nav: 56,
    totalValue: 78,
    grossDPI: 0.32,
    grossMOIC: 1.15,
    grossIRR: 8.9,
  },
  // Non-Controlled
  {
    id: 'cyan',
    fundId: 'mc-iv',
    category: 'Non-Controlled',
    company: 'Cyan Tech',
    description: 'B2B SaaS platform for enterprise resource planning',
    vintage: 2022,
    status: 'Unrealized',
    investedCapital: 22,
    realizedValue: 0,
    nav: 30,
    totalValue: 30,
    grossDPI: 0.00,
    grossMOIC: 1.36,
    grossIRR: 18.5,
  },
  {
    id: 'prata',
    fundId: 'mc-iv',
    category: 'Non-Controlled',
    company: 'Prata Agro',
    description: 'Precision agriculture and crop inputs distribution',
    vintage: 2023,
    status: 'Unrealized',
    investedCapital: 0,
    realizedValue: 0,
    nav: 0,
    totalValue: 0,
    grossDPI: 0.00,
    grossMOIC: 0.00,
    grossIRR: 0.0,
  },
]

// ─── Capital Activity (MC IV) ────────────────────────────────────────────────

export const mcIVCapitalActivity = {
  commitment: 1500,
  contributions: 452,
  distributions: 22,
  unused: 1048,
  pctContributed: 30.1,
  pctReturned: 4.9,
}

// ─── Partner Capital Evolution (MC IV) ──────────────────────────────────────

export const mcIVPartnerCapitalEvolution = [
  {
    quarter: '2Q25',
    openingNAV: 465,
    calls: 28,
    distributions: -5,
    pnl: 18,
    closingNAV: 506,
  },
  {
    quarter: '3Q25',
    openingNAV: 506,
    calls: 18,
    distributions: -8,
    pnl: 12,
    closingNAV: 528,
  },
  {
    quarter: '4Q25',
    openingNAV: 528,
    calls: 6,
    distributions: -9,
    pnl: -13,
    closingNAV: 512,
  },
]

// ─── Quarterly bar data (MC IV invested vs value) ────────────────────────────

export const mcIVQuarterlyPerformance = [
  { quarter: 'Q4 22', investedCapital: 85, nav: 90, realized: 0 },
  { quarter: 'Q2 23', investedCapital: 205, nav: 218, realized: 0 },
  { quarter: 'Q4 23', investedCapital: 372, nav: 388, realized: 0 },
  { quarter: 'Q2 24', investedCapital: 420, nav: 462, realized: 10 },
  { quarter: 'Q4 24', investedCapital: 452, nav: 512, realized: 22 },
]

// ─── Weekly Update (Brazil) ───────────────────────────────────────────────────

export const weeklyFunds = [
  { id: 'mdc-ii', label: 'MDC II — Brazil Weekly' },
  { id: 'mic-iii', label: 'MIC III — Brazil Weekly' },
]

export const weeklySchedule = [
  {
    company: 'Helios Health',
    description: 'Healthcare services',
    vintage: 2022,
    status: 'Unrealized' as InvestmentStatus,
    investedCapital: 85,
    realizedValue: 0,
    nav: 102,
    totalValue: 102,
    grossDPI: 0.00,
    grossMOIC: 1.20,
  },
  {
    company: 'Nova Logistics',
    description: 'Last-mile logistics',
    vintage: 2022,
    status: 'Unrealized' as InvestmentStatus,
    investedCapital: 110,
    realizedValue: 0,
    nav: 138,
    totalValue: 138,
    grossDPI: 0.00,
    grossMOIC: 1.25,
  },
  {
    company: 'Atlas Financial',
    description: 'Digital lending',
    vintage: 2023,
    status: 'Unrealized' as InvestmentStatus,
    investedCapital: 95,
    realizedValue: 0,
    nav: 108,
    totalValue: 108,
    grossDPI: 0.00,
    grossMOIC: 1.14,
  },
]

export const weeklyCapitalActivity = {
  commitment: 750,
  contributions: 718,
  distributions: 182,
  unused: 32,
  pctContributed: 95.7,
  pctReturned: 25.3,
}

export const weeklyPartnerCapitalEvolution = [
  { quarter: '2Q25', openingNAV: 802, calls: 22, distributions: -35, pnl: 33, closingNAV: 822 },
  { quarter: '3Q25', openingNAV: 822, calls: 10, distributions: -28, pnl: 18, closingNAV: 822 },
  { quarter: '4Q25', openingNAV: 822, calls: 5, distributions: -18, pnl: 13, closingNAV: 822 },
]

export const weeklyQuarterlyPerformance = [
  { quarter: 'Q4 18', investedCapital: 120, nav: 128, realized: 0 },
  { quarter: 'Q2 20', investedCapital: 320, nav: 352, realized: 22 },
  { quarter: 'Q4 21', investedCapital: 520, nav: 615, realized: 60 },
  { quarter: 'Q2 23', investedCapital: 680, nav: 802, realized: 120 },
  { quarter: 'Q4 24', investedCapital: 718, nav: 822, realized: 182 },
]
