# Mubadala Capital PE Dashboard

Next.js 14 App Router prototype that replicates the Power BI quarterly report.
Data lives in `data/*.csv`; logic in `lib/`.

---

## Power BI Data Model

### Table Architecture

```
Dimensions
  Investee_Names   ← alias of PEQPR Names (fund metadata)
  DIM_Dates        ← generated date spine 2020-01-01 → 2030-12-31

Facts
  Summary Fact     ← fund-level KPIs (All Funds report)
  PE_Portfolio Fact← investment-level detail (SOI)

Source tables (raw, hidden in PBI)
  PEQPR Names      ← CSV: PEQPR NAMES.csv
  Managed Funds    ← CSV: Managed Funds.csv
  SOI              ← union of SOI Directs + SOI Funds + SOI CIV Directs + SOI CIV Funds
  SOI Directs      ← CSV: SOI Direct.csv
  SOI Funds        ← CSV: SOI Fund.csv
  SOI CIV Directs  ← (not in CSVs yet)
  SOI CIV Funds    ← (not in CSVs yet)
  Metrics          ← SharePoint Excel "Finance Customizable Files v1.xlsx" / sheet "Metrics"
  Notes            ← SharePoint Excel, sheet "Merge1"
  IRR per Portfolio← CSV: IRR per Portfolio.csv
```

---

## CSV Schemas

### PEQPR NAMES.csv → Investee_Names
Primary fund dimension. One row per fund.

| Column | Type | Notes |
|--------|------|-------|
| Sk_Investee | int | surrogate key (index) |
| MC2025Q1FundID | text | join key across all tables |
| Fund Name (Short) | text | |
| Fund Name (Long) | text | |
| Grouping | text | "Flagship" / "Continuation" / "Co-Investment" |
| Vintage | int | |
| Fund Family | text | |
| SortOrder | int | display order |
| Order_Grouping | int | 1=Flagship, 2=Continuation, 3=Co-Investment |

### Managed Funds.csv → Summary Fact (source)
Raw data before pivot. Multiple rows per fund per date (one per "Invested By" category).

| Column | Type | Notes |
|--------|------|-------|
| Reporting Date | date | quarter end date |
| Fund Name (Short) | text | |
| Fund Name (Long) | text | |
| MC2025Q1FundID | text | join key |
| Invested By | text | pivot column: "Carried Interest", "GP Commitment", "Third Party", "MC", "MIC", "Solutions" |
| Fund Family | text | |
| Commitment | number | |
| Remaining | number | |
| Called | number | |
| Distributed | number | |
| Adjusted NAV | number | |

### IRR per Portfolio.csv
Portfolio-level IRR data.

| Column | Type | Notes |
|--------|------|-------|
| Reporting Date | date | |
| Fund Name (Short) | text | |
| Fund Name (Long) | text | |
| Portfolio | text | |
| ADJUSTEDVALUATION | number | |
| DPI | number | |
| IRR | number | |
| PAIDIN | number | |
| PAIDOUT | number | |
| RVPI | number | |
| TVPI | number | |
| MC2025Q1FundID | text | |

### SOI Direct.csv → SOI Directs
Direct investment detail.

| Column | Type | Notes |
|--------|------|-------|
| Reporting Date | date | |
| Fund Name (Short/Long) | text | |
| Investee | text | company name |
| Short Name | text | |
| Investee Currency | text | |
| Vintage | int | |
| Geography | text | |
| Industry | text | "NN - Description" format |
| Project Code | text | |
| Investment Category | text | "Controlled Investments" / "Non-Controlled Investments" |
| Investments | number | = Total Invested |
| Realized Cost | number | |
| Current Valuation | number | = NAV |
| Total Value | number | |
| Total Income | number | |
| Current Cost | number | (removed in PBI) |
| Principal | number | |
| IRR | number | |
| Gross IRR | number | |
| Multiple | number | = Gross MOIC |
| Proceeds | number | |
| All Other Income / Dividends / Other Income | number | |
| MC2025Q1FundID | text | |

**Derived in PBI:**
- `Realizations` = Total Income + Proceeds
- `Gross DPI` = Realizations / Total Invested
- `Net MOIC` = Total Value / Total Invested
- `Net DPI` = Realizations / Total Invested
- `SOIKey` = "Direct"

### SOI Fund.csv → SOI Funds
Fund-of-funds investment detail.

| Column | Type | Notes |
|--------|------|-------|
| Reporting Date | date | |
| Fund Name (Short/Long) | text | |
| Investee | text | |
| Short Name | text | |
| Investee Currency | text | |
| Investment Category | text | |
| Vintage | int | |
| Geography | text | |
| Industry | text | original industry field |
| Sector Focus | text | = Industry (renamed) |
| Project Code | text | |
| Commitment | number | |
| Remaining Commitment | number | |
| Realized | number | = Realizations |
| Adjusted NAV | number | = NAV |
| Total Called | number | = Total Invested |
| Last NAV / Last NAV Date | removed in PBI | |
| IRR | number | = Gross IRR |
| Multiple | number | = Gross MOIC |
| MC2025Q1FundID | text | |

**Derived in PBI:**
- `Total Value` = NAV + Realizations
- `Gross DPI` = Realizations / Total Invested
- `Net MOIC` = Total Value / Total Invested
- `Net DPI` = Realizations / Total Invested
- `SOIKey` = "Funds"

---

## Power Query Transformations

### Summary Fact (All Funds fact table)
Source: `Managed Funds.csv`

```
1. Add SK_Date = yyyyMMdd number from Reporting Date
2. LEFT JOIN Investee_Names ON MC2025Q1FundID → bring Sk_Investee
3. Pivot "Invested By" column → columns: Carried Interest, GP Commitment, Third Party, MC, MIC, Solutions
4. Replace nulls with 0 in all pivoted columns
5. GROUP BY {Reporting Date, Fund Name (Short), Fund Name (Long), MC2025Q1FundID, Fund Family}
   SUM: Remaining, Called, Distributed, Nav (=Adjusted NAV),
        Carried Interest, GP Commitment, Third Party, MC, MIC, Solutions
6. LEFT JOIN Metrics ON {MC2025Q1FundID, Reporting Date} = {Investee, Quarter}
   → brings: IRR Gross, IRR Net, DPI Net, MOIC Net
7. LEFT JOIN Notes ON {MC2025Q1FundID, SK_Date} = {Investee, Date_Norm}
   → brings: final note (formatted with line breaks after each sentence)
8. Add Contributions = Called (duplicate)
9. Add Fund Size = Third Party + MC + Carried Interest + GP Commitment + MIC + Solutions
10. Add Total Value = Distributed + Nav
11. Recalculate Third Party = GP Commitment + Third Party_raw
```

### PE_Portfolio Fact (investment detail)
Source: `SOI` (union of Directs + Funds + CIV Directs + CIV Funds)

```
1. Add SK_Date
2. LEFT JOIN Investee_Names ON MC2025Q1FundID → bring Sk_Investee
3. Remove Fund Name (Short) column
4. Add Status = "Unrealized" if NAV > 0, else "Realized"
5. Rename: Investment Category → "Category (Controlled/Non-C, FI)"
6. Add Category Order: Controlled=1, Non-Controlled=2, else 3
7. Trim & Clean Investee name
8. Industry column: strip numeric prefix "NN - " → keep description only
```

### SOI (union table)
```
Table.Combine({SOI Directs, SOI Funds, SOI CIV Directs, SOI CIV Funds})
Industry column: if format is "NN - Description", extract description after hyphen
```

### PEQPR Names → Investee_Names
```
1. Remove duplicate Fund Name (Long)
2. Add Index as Sk_Investee (1-based)
3. Add Order_Grouping: Flagship=1, Continuation=2, else 3
```

### DIM_Dates
Generated table 2020-01-01 to 2030-12-31 with:
- SK_Date (yyyyMMdd as number)
- Date, Date_STD (yyyy-MM-dd)
- Year, Quarter (Q1-Q4), QuarterWithYear (yyyy-Q#)
- DayQuarter (day within quarter)
- QuarterEndDate, QuarterEndDateText
- IsCurrentDate flag

---

## Key Join Keys

| Join | Left table | Right table | Key |
|------|-----------|-------------|-----|
| Fund metadata | Summary Fact / PE_Portfolio | Investee_Names | MC2025Q1FundID |
| Performance metrics | Summary Fact | Metrics | MC2025Q1FundID + Reporting Date |
| Fund notes | Summary Fact | Notes | MC2025Q1FundID + SK_Date |
| Date spine | Any fact | DIM_Dates | SK_Date |

---

## Missing / External Sources (not in CSVs)

- **Metrics table**: SharePoint Excel, sheet "Metrics". Provides `IRR Gross`, `IRR Net`, `DPI Net`, `MOIC Net` per fund per quarter. **Critical for All Funds KPIs.**
- **Notes table**: SharePoint Excel, sheet "Merge1". Provides formatted fund notes.
- **SOI CIV Directs / SOI CIV Funds**: Co-Investment Vehicle data, not exported to CSV yet.
