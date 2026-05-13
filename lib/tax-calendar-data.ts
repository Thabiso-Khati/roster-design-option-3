/**
 * Tax Calendar — country-specific obligations for the music business.
 * ──────────────────────────────────────────────────────────────────
 * Coverage: AFRICA_TOP15 markets — South Africa, Nigeria, Ghana, Kenya,
 * Egypt, Ethiopia, Morocco, Algeria, Côte d'Ivoire, Cameroon, Tanzania,
 * Senegal, Angola, Uganda, Zimbabwe.
 *
 * IMPORTANT: tax dates and rates change. This module is for planning
 * only, not tax advice. Always verify with the local revenue authority
 * before filing. Last reviewed: April 2026.
 */
export interface TaxItem {
  date: string;
  obligation: string;
  who: string;
  note: string;
}

// ── SOUTH AFRICA ──────────────────────────────────────────────
const SA: TaxItem[] = [
  { date: "Last working day Feb",                      obligation: "Provisional tax — first period",          who: "Sole prop / company / freelancer above threshold",   note: "IRP6 paid 6 months into tax year (Sep)" },
  { date: "Last working day Aug",                      obligation: "Provisional tax — second period",         who: "Same",                                               note: "Second IRP6 — most artists fall behind here" },
  { date: "End Feb (annually)",                        obligation: "Tax year-end (SARS)",                     who: "Everyone",                                           note: "SA tax year runs 1 Mar – 28/29 Feb" },
  { date: "End Sep (typical filing season open)",      obligation: "ITR12 (individual) / ITR14 (company) returns open", who: "Everyone earning above threshold",         note: "Filing season: Sep–Nov for most" },
  { date: "Monthly — 7th of each month",               obligation: "PAYE / UIF / SDL",                        who: "Employers (incl. labels paying staff)",              note: "EMP201 submitted via SARS eFiling" },
  { date: "End of every 2nd month",                    obligation: "VAT submission (Category B — most musicians)", who: "VAT-registered (turnover over R1m)",            note: "VAT201 — payment due last working day after period end" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels accounting to artists, publishers",           note: "Most label contracts use these dates — pair with Royalty Statement Reconciliation tool" },
  { date: "Per show day",                              obligation: "Withholding tax on foreign performance",  who: "Foreign artists in SA / SA artists abroad",          note: "UK 20%, US 30%, EU varies. Reclaim via DTA where applicable." },
  { date: "Annually 31 Mar",                           obligation: "Workmen's Compensation (COIDA)",          who: "Employers",                                          note: "Online return of earnings via CompEasy" },
  { date: "Annually 31 May",                           obligation: "Employer Tax Reconciliation (EMP501) interim", who: "Employers",                                     note: "Includes all PAYE / UIF / SDL for the period" },
];

// ── NIGERIA ───────────────────────────────────────────────────
const NG: TaxItem[] = [
  { date: "Per pay period (typically 10th of next month)", obligation: "PAYE — Personal Income Tax",          who: "Employers (incl. labels)",                           note: "Filed via state Internal Revenue Service (LIRS / OGIRS / etc.)" },
  { date: "By 21st of each month",                     obligation: "VAT 7.5% — VAT 100A (FIRS)",              who: "VAT-registered businesses",                          note: "Filed online via TaxPro Max" },
  { date: "By 21st of each month",                     obligation: "WHT — Withholding Tax (FIRS)",            who: "Anyone making payments subject to WHT",              note: "Includes royalties, rent, professional services. Rates 5–10%." },
  { date: "By 31 March",                               obligation: "Companies Income Tax (CIT)",              who: "Companies (LTD)",                                    note: "30% — small companies under N25m turnover may be exempt" },
  { date: "Within 90 days of year-end",                obligation: "Annual returns (CAC)",                    who: "Registered companies",                               note: "Corporate Affairs Commission filing" },
  { date: "By 31 March (annually)",                    obligation: "Personal Income Tax annual return",       who: "Self-employed / freelancers",                        note: "State IRS filing" },
  { date: "Per show / per remit",                      obligation: "Withholding tax on foreign artist performance", who: "Local promoter for foreign artist; or foreign WHT on Nigerian artist abroad", note: "FIRS WHT 10% on royalties; reciprocal DTA reclaim available with UK, France, etc." },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods (where in contract)", who: "Labels accounting to artists, COSON/MCSN to members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Annually",                                  obligation: "ITF (Industrial Training Fund) levy",     who: "Employers with 5+ employees and ₦50m+ turnover",     note: "1% of payroll" },
  { date: "Annually",                                  obligation: "NSITF — Employee Compensation Scheme",    who: "Employers",                                          note: "1% of payroll, paid to NSITF" },
];

// ── GHANA ─────────────────────────────────────────────────────
const GH: TaxItem[] = [
  { date: "Quarterly (15 Apr / 15 Jul / 15 Oct / 15 Jan)", obligation: "Provisional tax — quarterly instalments", who: "Sole prop / company / self-employed",            note: "GRA TIN required; instalments based on prior-year liability" },
  { date: "By 4 months after year-end",                obligation: "Annual income tax return (Companies / Individuals)", who: "Everyone above tax-free threshold",        note: "Returns filed at GRA" },
  { date: "By 15th of each month",                     obligation: "PAYE on emoluments",                      who: "Employers",                                          note: "Filed at Ghana Revenue Authority (GRA)" },
  { date: "By last working day of each month",         obligation: "VAT 15% (+2.5% NHIL + 2.5% GETFund + 1% COVID-19)", who: "VAT-registered (turnover over GHC 200,000)",  note: "Effective ~21% combined; filed via GRA E-Services" },
  { date: "By 15th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone making payments subject to WHT",              note: "Royalties to non-residents 15%; resident professionals 7.5%; goods / services 5–7.5%" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Ghana / Ghanaian artists abroad", note: "20% withholding on Ghana-source performance income for non-residents; DTA reclaim where treaty exists (UK, France, Italy, SA via SADC)" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, GHAMRO members",                             note: "GHAMRO bi-annual distribution; pair with Royalty Statement Reconciliation tool" },
  { date: "Annually 31 March",                         obligation: "SSNIT contribution annual reconciliation", who: "Employers",                                         note: "Social Security and National Insurance Trust — 13.5% employer + 5.5% employee" },
  { date: "Annually",                                  obligation: "GHAMRO copyright royalty registration / renewal", who: "Songwriters, publishers",                    note: "Free at registration; renewal annually" },
];

// ── KENYA ─────────────────────────────────────────────────────
const KE: TaxItem[] = [
  { date: "By 9th of each month",                      obligation: "PAYE remittance",                         who: "Employers (incl. labels)",                           note: "Filed via KRA iTax" },
  { date: "By 20th of each month",                     obligation: "VAT 16% — VAT3 form",                     who: "VAT-registered (turnover over KES 5M)",              note: "Filed via iTax" },
  { date: "By 20th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone making payments subject to WHT",              note: "Royalties to non-residents 20%; resident professional services 5%; rent 10%" },
  { date: "By 30 April",                               obligation: "Annual income tax return (companies)",    who: "Companies (LTD)",                                    note: "30% CIT (resident) / 37.5% (non-resident PE)" },
  { date: "By 30 June",                                obligation: "Annual income tax return (individuals)",  who: "Self-employed, salaried above threshold",            note: "Return filed via iTax" },
  { date: "Quarterly (20 Apr / 20 Jul / 20 Oct / 20 Jan)", obligation: "Instalment tax",                       who: "Companies / sole props with prior-year tax > KES 40,000", note: "25% per quarter of prior-year liability" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists in Kenya / Kenyan artists abroad",   note: "20% WHT on Kenya-source performance income; DTA reclaim where treaty (UK, France, India, etc.)" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, MCSK / KAMP / PRSK members",                 note: "Bi-annual distributions; MCSK (writers) + KAMP (performers/master owners) + PRSK (performers) operate as 3-society system" },
  { date: "Monthly",                                   obligation: "NSSF + NHIF contributions",               who: "Employers",                                          note: "NSSF (~6% employer + 6% employee, capped); NHIF based on graduated scale" },
  { date: "Annually 30 June",                          obligation: "Music Copyright Society of Kenya (MCSK) registration", who: "Songwriters, publishers",                  note: "Required for collection of public performance / mechanical royalties in Kenya" },
];

// ── EGYPT ─────────────────────────────────────────────────────
const EG: TaxItem[] = [
  { date: "By end of next month",                      obligation: "VAT 14% — monthly return",                who: "VAT-registered (turnover over EGP 500,000)",         note: "Filed via Egyptian Tax Authority (ETA) e-Filing portal" },
  { date: "By 15th of each month",                     obligation: "PAYE / Salary tax remittance",            who: "Employers",                                          note: "Progressive 0–27.5% bands; filed via Form 4 with ETA" },
  { date: "By 30 April",                               obligation: "Annual income tax — individuals",         who: "Self-employed / freelancers above EGP 30,000",       note: "Progressive bands up to 27.5%; filed online via ETA portal" },
  { date: "Within 4 months of fiscal year-end",        obligation: "Corporate Income Tax — annual return",    who: "Companies (LLC, JSC)",                               note: "22.5% CIT; quarterly advance instalments where applicable" },
  { date: "By 15th of each month",                     obligation: "Withholding tax — royalties / services",  who: "Anyone paying royalties or professional services",   note: "20% WHT on royalties to non-residents; 5% on local services; DTA relief possible (UK, France, US, etc.)" },
  { date: "Per show / per remit",                      obligation: "Non-resident artist tax",                 who: "Foreign artists performing in Egypt",                note: "20% WHT on performance income; promoter remits to ETA" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, SACERAU (collective management) members",    note: "SACERAU bi-annual distributions; pair with Royalty Statement Reconciliation tool" },
  { date: "By 15th of each month",                     obligation: "Social Insurance contributions",          who: "Employers + employees",                              note: "Combined ~25% of insurable wage; National Organization for Social Insurance (NOSI)" },
  { date: "Annually",                                  obligation: "Stamp duty on contracts",                 who: "Anyone signing taxable contracts",                   note: "Variable rates 0.4–20%; relevant on management / publishing deals" },
];

// ── ETHIOPIA ──────────────────────────────────────────────────
const ET: TaxItem[] = [
  { date: "By end of next month",                      obligation: "VAT 15% — monthly return",                who: "VAT-registered (turnover over ETB 1m)",              note: "Filed via Ministry of Revenues (MOR) e-Tax portal" },
  { date: "By end of next month",                      obligation: "Schedule A — Employment Income Tax (PAYE)", who: "Employers",                                       note: "Progressive 10–35%; filed via MOR" },
  { date: "By end of 4 months after year-end",         obligation: "Schedule C — Business Income Tax",        who: "Sole props, partnerships, companies",                note: "30% CIT (Cat. A); progressive for smaller traders (Cat. B/C)" },
  { date: "Quarterly (Cat. A taxpayers)",              obligation: "Provisional tax instalments",             who: "Category A businesses",                              note: "Based on prior-year liability; settled at year-end" },
  { date: "By end of next month",                      obligation: "Withholding tax — royalties / services",  who: "Anyone paying WHT-taxable amounts",                  note: "Royalties / management fees to non-residents 5–30% depending on DTA; 2% on local supplies" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Ethiopia",             note: "10% WHT on Ethiopia-source performance income (or treaty rate)" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, ECOMA (Ethiopian Copyright & Music Authors) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "Pension contributions (POESSA)",          who: "Employers + employees (private sector)",             note: "11% employer + 7% employee; Private Organisation Employees' Social Security Agency" },
  { date: "Annually 7 July",                           obligation: "Ethiopian fiscal year-end",               who: "All taxpayers",                                      note: "ET fiscal year runs 8 July – 7 July (Hamle 1 – Sene 30)" },
];

// ── MOROCCO ───────────────────────────────────────────────────
const MA: TaxItem[] = [
  { date: "By end of next month",                      obligation: "TVA 20% — monthly declaration",           who: "VAT-registered (turnover over MAD 1m)",              note: "Filed via Direction Générale des Impôts (DGI) SIMPL-TVA portal; quarterly option for smaller businesses" },
  { date: "By end of next month",                      obligation: "IR Salaire (PAYE) remittance",            who: "Employers",                                          note: "Progressive 0–38%; filed online via SIMPL-IR" },
  { date: "By 30 April",                               obligation: "IR — Annual return (employees)",          who: "Salaried individuals",                               note: "Most adjustments handled via employer; freelancers use SIMPL-IR" },
  { date: "By 31 May",                                 obligation: "IR — Annual return (self-employed)",      who: "Sole props, freelancers",                            note: "Includes business income; minimum tax 0.25% turnover" },
  { date: "By 31 March",                               obligation: "IS — Corporate Income Tax annual return", who: "Companies (SA, SARL)",                               note: "20–35% scaled by profit band; quarterly advance instalments" },
  { date: "Quarterly (31 Mar / 30 Jun / 30 Sep / 31 Dec)", obligation: "IS quarterly instalments",            who: "Companies",                                          note: "25% of prior-year tax each quarter" },
  { date: "By end of next month",                      obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services",                 note: "10% WHT on royalties to non-residents; reciprocal DTA reduces with UK, France (0%), Spain, etc." },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Morocco",              note: "10% WHT on Morocco-source performance fees; promoter remits" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, BMDA (Bureau Marocain du Droit d'Auteur) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "CNSS social security contributions",      who: "Employers",                                          note: "~21% employer + 6.74% employee on capped wage; Caisse Nationale de Sécurité Sociale" },
];

// ── ALGERIA ───────────────────────────────────────────────────
const DZ: TaxItem[] = [
  { date: "By 20th of each month",                     obligation: "TVA 19% — monthly G50 declaration",       who: "VAT-registered (real-regime taxpayers)",             note: "Form G50 filed at DGI; reduced 9% rate on certain goods" },
  { date: "By 20th of each month",                     obligation: "TAP — Tax sur l'Activité Professionnelle", who: "Businesses generating professional income",         note: "1–2% of turnover; remitted with G50" },
  { date: "By 20th of each month",                     obligation: "IRG salaries (PAYE)",                     who: "Employers",                                          note: "Progressive 0–35%; remitted with G50" },
  { date: "By 30 April",                               obligation: "IRG — Annual return (individuals)",       who: "Self-employed / freelancers",                        note: "Direction Générale des Impôts (DGI); progressive bands" },
  { date: "By 30 April",                               obligation: "IBS — Corporate Income Tax annual",       who: "Companies (SARL, SPA)",                              note: "19% manufacturing / 23% construction / 26% services and trade" },
  { date: "By 30 June",                                obligation: "IFU — Single Flat Tax",                   who: "Small businesses (turnover < DZD 8m)",               note: "5–12% of turnover depending on activity; quarterly advances" },
  { date: "Per remit",                                 obligation: "Withholding tax — royalties / services",  who: "Anyone paying non-residents",                        note: "24% WHT on royalties / artist fees to non-residents (or DTA rate — France, UK, Italy)" },
  { date: "Per show",                                  obligation: "Non-resident performer tax",              who: "Foreign artists performing in Algeria",              note: "24% WHT on Algeria-source performance income" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, ONDA (Office National des Droits d'Auteur) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "CASNOS / CNAS social security",           who: "Employers / self-employed",                          note: "~26% employer + 9% employee for salaried; CASNOS for self-employed" },
];

// ── CÔTE D'IVOIRE ─────────────────────────────────────────────
const CI: TaxItem[] = [
  { date: "By 15th of each month (private) / 10th (public)", obligation: "TVA 18% — monthly declaration",     who: "VAT-registered (turnover over XOF 50m services / 200m goods)", note: "Filed via Direction Générale des Impôts (DGI) e-Impôts portal" },
  { date: "By 15th of each month",                     obligation: "ITS / IRPP — PAYE on salaries",           who: "Employers",                                          note: "Progressive bands; filed via DGI" },
  { date: "By 20 April",                               obligation: "BIC — Annual return (Industrial / Commercial Profits)", who: "Sole props, companies",                  note: "25% standard CIT (BIC); 30% telecoms/banks; reduced for SME" },
  { date: "By 20 April",                               obligation: "Annual personal income tax return",       who: "Individuals above threshold",                        note: "DGI e-Impôts; salaried individuals via employer" },
  { date: "By 15th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services",                 note: "25% WHT on royalties / fees to non-residents (or DTA rate); 10% local services" },
  { date: "Per show / per remit",                      obligation: "Non-resident artist tax",                 who: "Foreign artists performing in Côte d'Ivoire",        note: "25% WHT on performance fees; reduced under France / UEMOA treaties" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, BURIDA (Bureau Ivoirien du Droit d'Auteur) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "CNPS social security",                    who: "Employers",                                          note: "~16.4% employer + 6.3% employee on capped wage; Caisse Nationale de Prévoyance Sociale" },
  { date: "Annually",                                  obligation: "Patente / Business licence",              who: "All commercial businesses",                          note: "Combined fixed + variable on turnover; due in March" },
];

// ── CAMEROON ──────────────────────────────────────────────────
const CM: TaxItem[] = [
  { date: "By 15th of each month",                     obligation: "TVA 19.25% (incl. 10% CAC) — monthly",   who: "VAT-registered (turnover over XAF 50m)",             note: "Filed via Direction Générale des Impôts (DGI); incl. additional 10% Communal Tax (CAC)" },
  { date: "By 15th of each month",                     obligation: "IRPP — PAYE on salaries",                 who: "Employers",                                          note: "Progressive 11–38.5% (incl. CAC); filed via DGI" },
  { date: "By 15 March",                               obligation: "IRPP / IS — Annual return",               who: "Sole props, companies, employees",                   note: "33% IS (CIT incl. CAC); minimum tax 2.2% of turnover" },
  { date: "Quarterly (15 Mar / 15 Jun / 15 Sep / 15 Dec)", obligation: "IS provisional advances",             who: "Companies",                                          note: "2.2% of quarterly turnover; settled at year-end" },
  { date: "By 15th of each month",                     obligation: "Withholding tax — royalties / services",  who: "Anyone paying WHT-taxable amounts",                  note: "15% WHT on royalties to non-residents (or DTA rate); 5.5% on local services + CAC" },
  { date: "Per show / per remit",                      obligation: "Non-resident artist tax",                 who: "Foreign artists performing in Cameroon",             note: "15% WHT on Cameroon-source performance income" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, CMC (Cameroon Music Corporation) members",   note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "CNPS social security",                    who: "Employers",                                          note: "~12.95% employer + 4.2% employee on capped wage; Caisse Nationale de Prévoyance Sociale" },
  { date: "Annually",                                  obligation: "Patente — Business licence",              who: "All commercial businesses",                          note: "Combined fixed + turnover-based; due February" },
];

// ── TANZANIA ──────────────────────────────────────────────────
const TZ: TaxItem[] = [
  { date: "By 20th of each month",                     obligation: "VAT 18% — monthly return",                who: "VAT-registered (turnover over TZS 200m)",            note: "Filed via Tanzania Revenue Authority (TRA) online portal" },
  { date: "By 7th of each month",                      obligation: "PAYE remittance",                         who: "Employers",                                          note: "Progressive 9–30%; filed via TRA" },
  { date: "By 7th of each month",                      obligation: "Skills Development Levy (SDL)",           who: "Employers with 4+ employees",                        note: "3.5% of payroll; filed with PAYE" },
  { date: "Quarterly (31 Mar / 30 Jun / 30 Sep / 31 Dec)", obligation: "Provisional / Statement of Estimated Tax", who: "Companies, sole props",                       note: "Quarterly instalments based on estimated annual income; final return 6 months post year-end" },
  { date: "By 6 months after year-end",                obligation: "Annual income tax return",                who: "Companies (CIT 30%) and individuals",                note: "Filed via TRA; minimum tax 0.3% turnover for unprofitable companies" },
  { date: "By 7th of each month",                      obligation: "Withholding tax remittance",              who: "Anyone paying WHT-taxable amounts",                  note: "15% WHT on royalties / management fees to non-residents (or DTA rate); 5–15% on local services" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Tanzania",             note: "15% WHT on Tanzania-source performance income" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, COSOTA (Copyright Society of Tanzania) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "By 7th of each month",                      obligation: "NSSF / PSSSF social security",            who: "Employers",                                          note: "10% employer + 10% employee; National Social Security Fund (private) or PSSSF (public)" },
  { date: "By 7th of each month",                      obligation: "Workers' Compensation Fund (WCF)",        who: "Employers",                                          note: "0.5% of payroll" },
];

// ── SENEGAL ───────────────────────────────────────────────────
const SN: TaxItem[] = [
  { date: "By 15th of each month",                     obligation: "TVA 18% — monthly declaration",           who: "VAT-registered (turnover over XOF 50m services)",    note: "Filed via Direction Générale des Impôts et Domaines (DGID) e-Tax portal" },
  { date: "By 15th of each month",                     obligation: "IR Salaires — PAYE",                      who: "Employers",                                          note: "Progressive 0–40%; filed via DGID" },
  { date: "By 30 April",                               obligation: "IS — Corporate Income Tax annual",        who: "Companies",                                          note: "30% CIT; minimum 0.5% turnover" },
  { date: "By 30 April",                               obligation: "IR — Annual personal income tax",         who: "Self-employed / freelancers",                        note: "Progressive; salaried via employer" },
  { date: "Quarterly (15 Feb / 30 Apr / 31 Jul / 31 Oct)", obligation: "IS / IR provisional instalments",     who: "Companies / sole props",                             note: "Three advance payments + final return; based on prior-year tax" },
  { date: "By 15th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services",                 note: "20% WHT on royalties to non-residents (or DTA rate); 5% on local services" },
  { date: "Per show / per remit",                      obligation: "Non-resident artist tax",                 who: "Foreign artists performing in Senegal",              note: "20% WHT on Senegal-source performance income" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, SODAV (Société Sénégalaise du Droit d'Auteur) members", note: "SODAV (replaced BSDA in 2016); pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "IPRES + CSS social security",             who: "Employers",                                          note: "IPRES (pension) + Caisse de Sécurité Sociale (family + work injury); ~21% combined on capped wage" },
  { date: "Annually",                                  obligation: "CFCE — Contribution Forfaitaire à la Charge des Employeurs", who: "Employers",                              note: "3% of payroll" },
];

// ── ANGOLA ────────────────────────────────────────────────────
const AO: TaxItem[] = [
  { date: "By end of next month",                      obligation: "IVA 14% — monthly return",                who: "VAT-registered (turnover over AOA 350m)",            note: "Filed via Administração Geral Tributária (AGT) e-Fatura; quarterly under simplified regime" },
  { date: "By end of next month",                      obligation: "IRT — PAYE on salaries",                  who: "Employers",                                          note: "Progressive 0–25%; filed via AGT" },
  { date: "By 31 May",                                 obligation: "Imposto Industrial — Corporate annual",   who: "Companies (Group A/B)",                              note: "25% CIT; minimum 6.5% turnover" },
  { date: "By 31 May",                                 obligation: "IRT annual reconciliation",               who: "Employers",                                          note: "Year-end PAYE reconciliation" },
  { date: "Quarterly",                                 obligation: "Imposto Industrial provisional",          who: "Companies (Group A)",                                note: "Quarterly advance based on prior-year tax" },
  { date: "By end of next month",                      obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services",                 note: "6.5% WHT on services to non-residents; 10% on royalties (or DTA rate)" },
  { date: "Per show / per remit",                      obligation: "Non-resident artist tax",                 who: "Foreign artists performing in Angola",               note: "10% WHT on Angola-source performance income; promoter remits" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, UNAC-SA (União Nacional dos Artistas e Compositores) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "INSS social security",                    who: "Employers",                                          note: "8% employer + 3% employee on insurable wage; Instituto Nacional de Segurança Social" },
  { date: "Annually",                                  obligation: "Imposto de Selo (Stamp duty) on contracts", who: "Anyone signing taxable contracts",                  note: "Variable rates; common on management / publishing deals" },
];

// ── UGANDA ────────────────────────────────────────────────────
const UG: TaxItem[] = [
  { date: "By 15th of each month",                     obligation: "VAT 18% — monthly return",                who: "VAT-registered (turnover over UGX 150m)",            note: "Filed via Uganda Revenue Authority (URA) e-Tax portal" },
  { date: "By 15th of each month",                     obligation: "PAYE remittance",                         who: "Employers",                                          note: "Progressive 10–40%; filed via URA" },
  { date: "By 15th of each month",                     obligation: "Local Service Tax (LST)",                 who: "Employees / self-employed",                          note: "Annual scaled fee deducted by employer monthly (Apr–Jun)" },
  { date: "Quarterly (provisional)",                   obligation: "Provisional CIT — quarterly instalments", who: "Companies",                                          note: "30% CIT final; quarterly advances by 1st month of each quarter" },
  { date: "By 6 months after year-end",                obligation: "Annual income tax return",                who: "Companies + individuals above threshold",            note: "Filed via URA; standard year-end 30 June" },
  { date: "By 15th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services",                 note: "15% WHT on royalties / management fees to non-residents (or DTA rate); 6% on local professional services" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Uganda",               note: "15% WHT on Uganda-source performance income" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, UPRS (Uganda Performing Right Society) members", note: "UPRS bi-annual distribution; pair with Royalty Statement Reconciliation tool" },
  { date: "By 15th of each month",                     obligation: "NSSF social security",                    who: "Employers",                                          note: "10% employer + 5% employee; National Social Security Fund" },
  { date: "By 15th of each month",                     obligation: "Stamp duty on agreements",                who: "Parties to taxable agreements",                      note: "1.5% on most performance / management agreements" },
];

// ── ZIMBABWE ──────────────────────────────────────────────────
const ZW: TaxItem[] = [
  { date: "By 25th of each month",                     obligation: "VAT 15% — monthly return",                who: "VAT-registered (turnover over USD 25,000)",          note: "Filed via Zimbabwe Revenue Authority (ZIMRA) e-Services portal" },
  { date: "By 10th of each month",                     obligation: "PAYE remittance",                         who: "Employers",                                          note: "Progressive 0–40%; filed via ZIMRA" },
  { date: "Quarterly (25 Mar / 25 Jun / 25 Sep / 20 Dec) — QPDs", obligation: "Quarterly Payment Dates — CIT", who: "Companies, self-employed traders",               note: "10% / 25% / 30% / 35% of estimated annual tax (24.72% CIT incl. AIDS levy)" },
  { date: "By 30 April",                               obligation: "Annual income tax return",                who: "Companies + individuals above threshold",            note: "Reconciles QPDs; filed via ZIMRA" },
  { date: "By 10th of each month",                     obligation: "Withholding tax remittance",              who: "Anyone paying royalties / services / non-residents",  note: "15% WHT on royalties to non-residents (or DTA rate); 10% on local services to non-residents" },
  { date: "Per show / per remit",                      obligation: "Non-resident performer tax",              who: "Foreign artists performing in Zimbabwe",             note: "15% WHT on Zimbabwe-source entertainment income" },
  { date: "Per transaction",                           obligation: "IMTT — Intermediated Money Transfer Tax", who: "Anyone making electronic payments",                  note: "2% on most domestic electronic transfers; 4% on foreign currency transactions" },
  { date: "30 June + 31 December",                     obligation: "Royalty accounting periods",              who: "Labels, ZIMURA (Zimbabwe Music Rights Association) members", note: "Pair with Royalty Statement Reconciliation tool" },
  { date: "Monthly",                                   obligation: "NSSA contributions",                      who: "Employers",                                          note: "4.5% employer + 4.5% employee on capped wage; National Social Security Authority" },
  { date: "Annually",                                  obligation: "Standards Development Levy (SDL)",        who: "Employers",                                          note: "1% of payroll; pays to Standards Association of Zimbabwe" },
];

// ── EXPORT ────────────────────────────────────────────────────
export const TAX_CALENDAR_BY_COUNTRY: Record<string, TaxItem[]> = {
  "South Africa":   SA,
  "Nigeria":        NG,
  "Ghana":          GH,
  "Kenya":          KE,
  "Egypt":          EG,
  "Ethiopia":       ET,
  "Morocco":        MA,
  "Algeria":        DZ,
  "Côte d'Ivoire":  CI,
  "Cameroon":       CM,
  "Tanzania":       TZ,
  "Senegal":        SN,
  "Angola":         AO,
  "Uganda":         UG,
  "Zimbabwe":       ZW,
};

export const TAX_AUTHORITY_BY_COUNTRY: Record<string, string> = {
  "South Africa":   "SARS, VAT, PAYE, COIDA",
  "Nigeria":        "FIRS, state IRS, CAC, WHT",
  "Ghana":          "GRA, VAT + NHIL + GETFund, SSNIT, GHAMRO",
  "Kenya":          "KRA, NSSF, NHIF, MCSK / KAMP / PRSK",
  "Egypt":          "ETA (Egyptian Tax Authority), NOSI, SACERAU",
  "Ethiopia":       "MOR (Ministry of Revenues), POESSA, ECOMA",
  "Morocco":        "DGI, CNSS, BMDA",
  "Algeria":        "DGI, CNAS / CASNOS, ONDA",
  "Côte d'Ivoire":  "DGI, CNPS, BURIDA",
  "Cameroon":       "DGI, CNPS, CMC",
  "Tanzania":       "TRA, NSSF / PSSSF, COSOTA",
  "Senegal":        "DGID, IPRES + CSS, SODAV",
  "Angola":         "AGT (Administração Geral Tributária), INSS, UNAC-SA",
  "Uganda":         "URA, NSSF, UPRS",
  "Zimbabwe":       "ZIMRA, NSSA, ZIMURA",
};

/** Default fallback country if the user's country isn't covered. */
export const DEFAULT_TAX_COUNTRY = "South Africa";

/** All countries with full tax calendar coverage. */
export const COVERED_COUNTRIES = Object.keys(TAX_CALENDAR_BY_COUNTRY);
