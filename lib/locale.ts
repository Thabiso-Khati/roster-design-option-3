// ─────────────────────────────────────────────────────────────
// ROSTER  -  Country locale config (global edition)
// Maps every country to currency, symbol, locale, and tax info.
// Africa is prioritised in lists; currency can be overridden
// independently of country in user Settings.
// ─────────────────────────────────────────────────────────────

export interface LocaleConfig {
  country: string;
  currency: string;       // ISO 4217 code
  sym: string;            // Display symbol
  locale: string;         // BCP-47 locale for toLocaleString
  currencyName: string;   // Human-readable currency name
  taxName: string;        // "VAT", "GST", "Sales Tax" etc.
  taxRate: number;        // Default rate as a whole number (e.g. 15 for 15%)
  continent: string;      // For grouping in selects
}

// ── AFRICA (full continent) ────────────────────────────────────
const AFRICA: Record<string, LocaleConfig> = {
  // Top 15 IFPI African markets listed first
  "Nigeria":            { country: "Nigeria",            currency: "NGN", sym: "₦",    locale: "en-NG", currencyName: "Naira",     taxName: "VAT",  taxRate: 7.5,   continent: "Africa" },
  "South Africa":       { country: "South Africa",       currency: "ZAR", sym: "R",    locale: "en-ZA", currencyName: "Rand",      taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Egypt":              { country: "Egypt",              currency: "EGP", sym: "E£",   locale: "ar-EG", currencyName: "Pound",     taxName: "VAT",  taxRate: 14,    continent: "Africa" },
  "Kenya":              { country: "Kenya",              currency: "KES", sym: "KSh",  locale: "en-KE", currencyName: "Shilling",  taxName: "VAT",  taxRate: 16,    continent: "Africa" },
  "Ghana":              { country: "Ghana",              currency: "GHS", sym: "GH₵",  locale: "en-GH", currencyName: "Cedi",      taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Tanzania":           { country: "Tanzania",           currency: "TZS", sym: "TSh",  locale: "sw-TZ", currencyName: "Shilling",  taxName: "VAT",  taxRate: 18,    continent: "Africa" },
  "Ethiopia":           { country: "Ethiopia",           currency: "ETB", sym: "Br",   locale: "am-ET", currencyName: "Birr",      taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Morocco":            { country: "Morocco",            currency: "MAD", sym: "MAD",  locale: "ar-MA", currencyName: "Dirham",    taxName: "TVA",  taxRate: 20,    continent: "Africa" },
  "Algeria":            { country: "Algeria",            currency: "DZD", sym: "DA",   locale: "ar-DZ", currencyName: "Dinar",     taxName: "TVA",  taxRate: 19,    continent: "Africa" },
  "Côte d'Ivoire":      { country: "Côte d'Ivoire",      currency: "XOF", sym: "CFA",  locale: "fr-CI", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Cameroon":           { country: "Cameroon",           currency: "XAF", sym: "FCFA", locale: "fr-CM", currencyName: "Franc",     taxName: "TVA",  taxRate: 19,    continent: "Africa" },
  "Uganda":             { country: "Uganda",             currency: "UGX", sym: "USh",  locale: "en-UG", currencyName: "Shilling",  taxName: "VAT",  taxRate: 18,    continent: "Africa" },
  "Senegal":            { country: "Senegal",            currency: "XOF", sym: "CFA",  locale: "fr-SN", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Angola":             { country: "Angola",             currency: "AOA", sym: "Kz",   locale: "pt-AO", currencyName: "Kwanza",    taxName: "IVA",  taxRate: 14,    continent: "Africa" },
  "Zimbabwe":           { country: "Zimbabwe",           currency: "ZWG", sym: "ZiG",  locale: "en-ZW", currencyName: "Gold",      taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  // Rest of Africa
  "Benin":              { country: "Benin",              currency: "XOF", sym: "CFA",  locale: "fr-BJ", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Botswana":           { country: "Botswana",           currency: "BWP", sym: "P",    locale: "en-BW", currencyName: "Pula",      taxName: "VAT",  taxRate: 14,    continent: "Africa" },
  "Burkina Faso":       { country: "Burkina Faso",       currency: "XOF", sym: "CFA",  locale: "fr-BF", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Burundi":            { country: "Burundi",            currency: "BIF", sym: "Fr",   locale: "fr-BI", currencyName: "Franc",     taxName: "VAT",  taxRate: 18,    continent: "Africa" },
  "Cape Verde":         { country: "Cape Verde",         currency: "CVE", sym: "Esc",  locale: "pt-CV", currencyName: "Escudo",    taxName: "IVA",  taxRate: 15,    continent: "Africa" },
  "Chad":               { country: "Chad",               currency: "XAF", sym: "FCFA", locale: "fr-TD", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Congo (DRC)":        { country: "Congo (DRC)",        currency: "CDF", sym: "FC",   locale: "fr-CD", currencyName: "Franc",     taxName: "TVA",  taxRate: 16,    continent: "Africa" },
  "Eswatini":           { country: "Eswatini",           currency: "SZL", sym: "E",    locale: "en-SZ", currencyName: "Lilangeni", taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Gabon":              { country: "Gabon",              currency: "XAF", sym: "FCFA", locale: "fr-GA", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Gambia":             { country: "Gambia",             currency: "GMD", sym: "D",    locale: "en-GM", currencyName: "Dalasi",    taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Guinea":             { country: "Guinea",             currency: "GNF", sym: "Fr",   locale: "fr-GN", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Lesotho":            { country: "Lesotho",            currency: "LSL", sym: "L",    locale: "en-LS", currencyName: "Loti",      taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Liberia":            { country: "Liberia",            currency: "LRD", sym: "L$",   locale: "en-LR", currencyName: "Dollar",    taxName: "VAT",  taxRate: 10,    continent: "Africa" },
  "Libya":              { country: "Libya",              currency: "LYD", sym: "LD",   locale: "ar-LY", currencyName: "Dinar",     taxName: "VAT",  taxRate: 0,     continent: "Africa" },
  "Madagascar":         { country: "Madagascar",         currency: "MGA", sym: "Ar",   locale: "mg-MG", currencyName: "Ariary",    taxName: "VAT",  taxRate: 20,    continent: "Africa" },
  "Malawi":             { country: "Malawi",             currency: "MWK", sym: "MK",   locale: "en-MW", currencyName: "Kwacha",    taxName: "VAT",  taxRate: 16.5,  continent: "Africa" },
  "Mali":               { country: "Mali",               currency: "XOF", sym: "CFA",  locale: "fr-ML", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Mauritius":          { country: "Mauritius",          currency: "MUR", sym: "Rs",   locale: "en-MU", currencyName: "Rupee",     taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Mozambique":         { country: "Mozambique",         currency: "MZN", sym: "MT",   locale: "pt-MZ", currencyName: "Metical",   taxName: "IVA",  taxRate: 17,    continent: "Africa" },
  "Namibia":            { country: "Namibia",            currency: "NAD", sym: "N$",   locale: "en-NA", currencyName: "Dollar",    taxName: "VAT",  taxRate: 15,    continent: "Africa" },
  "Niger":              { country: "Niger",              currency: "XOF", sym: "CFA",  locale: "fr-NE", currencyName: "Franc",     taxName: "TVA",  taxRate: 19,    continent: "Africa" },
  "Rwanda":             { country: "Rwanda",             currency: "RWF", sym: "RF",   locale: "rw-RW", currencyName: "Franc",     taxName: "VAT",  taxRate: 18,    continent: "Africa" },
  "Sierra Leone":       { country: "Sierra Leone",       currency: "SLL", sym: "Le",   locale: "en-SL", currencyName: "Leone",     taxName: "GST",  taxRate: 15,    continent: "Africa" },
  "Somalia":            { country: "Somalia",            currency: "SOS", sym: "Sh",   locale: "so-SO", currencyName: "Shilling",  taxName: "VAT",  taxRate: 10,    continent: "Africa" },
  "South Sudan":        { country: "South Sudan",        currency: "SSP", sym: "SSP",  locale: "en-SS", currencyName: "Pound",     taxName: "VAT",  taxRate: 18,    continent: "Africa" },
  "Sudan":              { country: "Sudan",              currency: "SDG", sym: "SDG",  locale: "ar-SD", currencyName: "Pound",     taxName: "VAT",  taxRate: 17,    continent: "Africa" },
  "Togo":               { country: "Togo",               currency: "XOF", sym: "CFA",  locale: "fr-TG", currencyName: "Franc",     taxName: "TVA",  taxRate: 18,    continent: "Africa" },
  "Tunisia":            { country: "Tunisia",            currency: "TND", sym: "DT",   locale: "ar-TN", currencyName: "Dinar",     taxName: "TVA",  taxRate: 19,    continent: "Africa" },
  "Zambia":             { country: "Zambia",             currency: "ZMW", sym: "ZK",   locale: "en-ZM", currencyName: "Kwacha",    taxName: "VAT",  taxRate: 16,    continent: "Africa" },
};

// ── AMERICAS ──────────────────────────────────────────────────
const AMERICAS: Record<string, LocaleConfig> = {
  "Argentina":          { country: "Argentina",          currency: "ARS", sym: "$",    locale: "es-AR", currencyName: "Peso",      taxName: "IVA",       taxRate: 21,   continent: "Americas" },
  "Bolivia":            { country: "Bolivia",            currency: "BOB", sym: "Bs.",  locale: "es-BO", currencyName: "Boliviano", taxName: "IVA",       taxRate: 13,   continent: "Americas" },
  "Brazil":             { country: "Brazil",             currency: "BRL", sym: "R$",   locale: "pt-BR", currencyName: "Real",      taxName: "ICMS",      taxRate: 12,   continent: "Americas" },
  "Canada":             { country: "Canada",             currency: "CAD", sym: "CA$",  locale: "en-CA", currencyName: "Dollar",    taxName: "GST",       taxRate: 5,    continent: "Americas" },
  "Chile":              { country: "Chile",              currency: "CLP", sym: "CLP$", locale: "es-CL", currencyName: "Peso",      taxName: "IVA",       taxRate: 19,   continent: "Americas" },
  "Colombia":           { country: "Colombia",           currency: "COP", sym: "COP$", locale: "es-CO", currencyName: "Peso",      taxName: "IVA",       taxRate: 19,   continent: "Americas" },
  "Costa Rica":         { country: "Costa Rica",         currency: "CRC", sym: "₡",    locale: "es-CR", currencyName: "Colon",     taxName: "IVA",       taxRate: 13,   continent: "Americas" },
  "Dominican Republic": { country: "Dominican Republic", currency: "DOP", sym: "RD$",  locale: "es-DO", currencyName: "Peso",      taxName: "ITBIS",     taxRate: 18,   continent: "Americas" },
  "Ecuador":            { country: "Ecuador",            currency: "USD", sym: "$",    locale: "es-EC", currencyName: "Dollar",    taxName: "IVA",       taxRate: 12,   continent: "Americas" },
  "Guatemala":          { country: "Guatemala",          currency: "GTQ", sym: "Q",    locale: "es-GT", currencyName: "Quetzal",   taxName: "IVA",       taxRate: 12,   continent: "Americas" },
  "Haiti":              { country: "Haiti",              currency: "HTG", sym: "G",    locale: "fr-HT", currencyName: "Gourde",    taxName: "TCA",       taxRate: 10,   continent: "Americas" },
  "Honduras":           { country: "Honduras",           currency: "HNL", sym: "L",    locale: "es-HN", currencyName: "Lempira",   taxName: "ISV",       taxRate: 15,   continent: "Americas" },
  "Jamaica":            { country: "Jamaica",            currency: "JMD", sym: "J$",   locale: "en-JM", currencyName: "Dollar",    taxName: "GCT",       taxRate: 15,   continent: "Americas" },
  "Mexico":             { country: "Mexico",             currency: "MXN", sym: "MX$",  locale: "es-MX", currencyName: "Peso",      taxName: "IVA",       taxRate: 16,   continent: "Americas" },
  "Nicaragua":          { country: "Nicaragua",          currency: "NIO", sym: "C$",   locale: "es-NI", currencyName: "Cordoba",   taxName: "IVA",       taxRate: 15,   continent: "Americas" },
  "Panama":             { country: "Panama",             currency: "PAB", sym: "B/.",  locale: "es-PA", currencyName: "Balboa",    taxName: "ITBM",      taxRate: 7,    continent: "Americas" },
  "Paraguay":           { country: "Paraguay",           currency: "PYG", sym: "Gs",   locale: "es-PY", currencyName: "Guarani",   taxName: "IVA",       taxRate: 10,   continent: "Americas" },
  "Peru":               { country: "Peru",               currency: "PEN", sym: "S/",   locale: "es-PE", currencyName: "Sol",       taxName: "IGV",       taxRate: 18,   continent: "Americas" },
  "Trinidad & Tobago":  { country: "Trinidad & Tobago",  currency: "TTD", sym: "TT$",  locale: "en-TT", currencyName: "Dollar",    taxName: "VAT",       taxRate: 12.5, continent: "Americas" },
  "United States":      { country: "United States",      currency: "USD", sym: "$",    locale: "en-US", currencyName: "Dollar",    taxName: "Sales Tax", taxRate: 0,    continent: "Americas" },
  "Uruguay":            { country: "Uruguay",            currency: "UYU", sym: "$U",   locale: "es-UY", currencyName: "Peso",      taxName: "IVA",       taxRate: 22,   continent: "Americas" },
  "Venezuela":          { country: "Venezuela",          currency: "VES", sym: "Bs.D", locale: "es-VE", currencyName: "Bolivar",   taxName: "IVA",       taxRate: 16,   continent: "Americas" },
};

// ── EUROPE ────────────────────────────────────────────────────
const EUROPE: Record<string, LocaleConfig> = {
  "Austria":            { country: "Austria",            currency: "EUR", sym: "€",    locale: "de-AT", currencyName: "Euro",    taxName: "MwSt",  taxRate: 20,  continent: "Europe" },
  "Belgium":            { country: "Belgium",            currency: "EUR", sym: "€",    locale: "nl-BE", currencyName: "Euro",    taxName: "BTW",   taxRate: 21,  continent: "Europe" },
  "Bulgaria":           { country: "Bulgaria",           currency: "BGN", sym: "lv",   locale: "bg-BG", currencyName: "Lev",     taxName: "DDS",   taxRate: 20,  continent: "Europe" },
  "Croatia":            { country: "Croatia",            currency: "EUR", sym: "€",    locale: "hr-HR", currencyName: "Euro",    taxName: "PDV",   taxRate: 25,  continent: "Europe" },
  "Cyprus":             { country: "Cyprus",             currency: "EUR", sym: "€",    locale: "el-CY", currencyName: "Euro",    taxName: "VAT",   taxRate: 19,  continent: "Europe" },
  "Czech Republic":     { country: "Czech Republic",     currency: "CZK", sym: "Kc",   locale: "cs-CZ", currencyName: "Koruna",  taxName: "DPH",   taxRate: 21,  continent: "Europe" },
  "Denmark":            { country: "Denmark",            currency: "DKK", sym: "kr",   locale: "da-DK", currencyName: "Krone",   taxName: "Moms",  taxRate: 25,  continent: "Europe" },
  "Estonia":            { country: "Estonia",            currency: "EUR", sym: "€",    locale: "et-EE", currencyName: "Euro",    taxName: "KM",    taxRate: 22,  continent: "Europe" },
  "Finland":            { country: "Finland",            currency: "EUR", sym: "€",    locale: "fi-FI", currencyName: "Euro",    taxName: "ALV",   taxRate: 24,  continent: "Europe" },
  "France":             { country: "France",             currency: "EUR", sym: "€",    locale: "fr-FR", currencyName: "Euro",    taxName: "TVA",   taxRate: 20,  continent: "Europe" },
  "Germany":            { country: "Germany",            currency: "EUR", sym: "€",    locale: "de-DE", currencyName: "Euro",    taxName: "MwSt",  taxRate: 19,  continent: "Europe" },
  "Greece":             { country: "Greece",             currency: "EUR", sym: "€",    locale: "el-GR", currencyName: "Euro",    taxName: "FPA",   taxRate: 24,  continent: "Europe" },
  "Hungary":            { country: "Hungary",            currency: "HUF", sym: "Ft",   locale: "hu-HU", currencyName: "Forint",  taxName: "AFA",   taxRate: 27,  continent: "Europe" },
  "Iceland":            { country: "Iceland",            currency: "ISK", sym: "kr",   locale: "is-IS", currencyName: "Krona",   taxName: "VSK",   taxRate: 24,  continent: "Europe" },
  "Ireland":            { country: "Ireland",            currency: "EUR", sym: "€",    locale: "en-IE", currencyName: "Euro",    taxName: "VAT",   taxRate: 23,  continent: "Europe" },
  "Italy":              { country: "Italy",              currency: "EUR", sym: "€",    locale: "it-IT", currencyName: "Euro",    taxName: "IVA",   taxRate: 22,  continent: "Europe" },
  "Latvia":             { country: "Latvia",             currency: "EUR", sym: "€",    locale: "lv-LV", currencyName: "Euro",    taxName: "PVN",   taxRate: 21,  continent: "Europe" },
  "Lithuania":          { country: "Lithuania",          currency: "EUR", sym: "€",    locale: "lt-LT", currencyName: "Euro",    taxName: "PVM",   taxRate: 21,  continent: "Europe" },
  "Luxembourg":         { country: "Luxembourg",         currency: "EUR", sym: "€",    locale: "fr-LU", currencyName: "Euro",    taxName: "TVA",   taxRate: 17,  continent: "Europe" },
  "Malta":              { country: "Malta",              currency: "EUR", sym: "€",    locale: "mt-MT", currencyName: "Euro",    taxName: "VAT",   taxRate: 18,  continent: "Europe" },
  "Netherlands":        { country: "Netherlands",        currency: "EUR", sym: "€",    locale: "nl-NL", currencyName: "Euro",    taxName: "BTW",   taxRate: 21,  continent: "Europe" },
  "Norway":             { country: "Norway",             currency: "NOK", sym: "kr",   locale: "nb-NO", currencyName: "Krone",   taxName: "MVA",   taxRate: 25,  continent: "Europe" },
  "Poland":             { country: "Poland",             currency: "PLN", sym: "zl",   locale: "pl-PL", currencyName: "Zloty",   taxName: "PTU",   taxRate: 23,  continent: "Europe" },
  "Portugal":           { country: "Portugal",           currency: "EUR", sym: "€",    locale: "pt-PT", currencyName: "Euro",    taxName: "IVA",   taxRate: 23,  continent: "Europe" },
  "Romania":            { country: "Romania",            currency: "RON", sym: "lei",  locale: "ro-RO", currencyName: "Leu",     taxName: "TVA",   taxRate: 19,  continent: "Europe" },
  "Russia":             { country: "Russia",             currency: "RUB", sym: "RUB",  locale: "ru-RU", currencyName: "Ruble",   taxName: "NDS",   taxRate: 20,  continent: "Europe" },
  "Serbia":             { country: "Serbia",             currency: "RSD", sym: "din",  locale: "sr-RS", currencyName: "Dinar",   taxName: "PDV",   taxRate: 20,  continent: "Europe" },
  "Slovakia":           { country: "Slovakia",           currency: "EUR", sym: "€",    locale: "sk-SK", currencyName: "Euro",    taxName: "DPH",   taxRate: 20,  continent: "Europe" },
  "Slovenia":           { country: "Slovenia",           currency: "EUR", sym: "€",    locale: "sl-SI", currencyName: "Euro",    taxName: "DDV",   taxRate: 22,  continent: "Europe" },
  "Spain":              { country: "Spain",              currency: "EUR", sym: "€",    locale: "es-ES", currencyName: "Euro",    taxName: "IVA",   taxRate: 21,  continent: "Europe" },
  "Sweden":             { country: "Sweden",             currency: "SEK", sym: "kr",   locale: "sv-SE", currencyName: "Krona",   taxName: "Moms",  taxRate: 25,  continent: "Europe" },
  "Switzerland":        { country: "Switzerland",        currency: "CHF", sym: "Fr",   locale: "de-CH", currencyName: "Franc",   taxName: "MWST",  taxRate: 7.7, continent: "Europe" },
  "Turkey":             { country: "Turkey",             currency: "TRY", sym: "TRY",  locale: "tr-TR", currencyName: "Lira",    taxName: "KDV",   taxRate: 20,  continent: "Europe" },
  "Ukraine":            { country: "Ukraine",            currency: "UAH", sym: "UAH",  locale: "uk-UA", currencyName: "Hryvnia", taxName: "PDV",   taxRate: 20,  continent: "Europe" },
  "United Kingdom":     { country: "United Kingdom",     currency: "GBP", sym: "GBP",  locale: "en-GB", currencyName: "Pound",   taxName: "VAT",   taxRate: 20,  continent: "Europe" },
};

// ── ASIA & PACIFIC ────────────────────────────────────────────
const ASIA_PACIFIC: Record<string, LocaleConfig> = {
  "Australia":          { country: "Australia",          currency: "AUD", sym: "A$",  locale: "en-AU", currencyName: "Dollar",  taxName: "GST",   taxRate: 10,  continent: "Asia & Pacific" },
  "Bangladesh":         { country: "Bangladesh",         currency: "BDT", sym: "BDT", locale: "bn-BD", currencyName: "Taka",    taxName: "VAT",   taxRate: 15,  continent: "Asia & Pacific" },
  "Cambodia":           { country: "Cambodia",           currency: "KHR", sym: "KHR", locale: "km-KH", currencyName: "Riel",    taxName: "VAT",   taxRate: 10,  continent: "Asia & Pacific" },
  "China":              { country: "China",              currency: "CNY", sym: "CNY", locale: "zh-CN", currencyName: "Yuan",    taxName: "VAT",   taxRate: 13,  continent: "Asia & Pacific" },
  "Hong Kong":          { country: "Hong Kong",          currency: "HKD", sym: "HK$", locale: "zh-HK", currencyName: "Dollar",  taxName: "N/A",   taxRate: 0,   continent: "Asia & Pacific" },
  "India":              { country: "India",              currency: "INR", sym: "INR", locale: "en-IN", currencyName: "Rupee",   taxName: "GST",   taxRate: 18,  continent: "Asia & Pacific" },
  "Indonesia":          { country: "Indonesia",          currency: "IDR", sym: "Rp",  locale: "id-ID", currencyName: "Rupiah",  taxName: "PPN",   taxRate: 11,  continent: "Asia & Pacific" },
  "Japan":              { country: "Japan",              currency: "JPY", sym: "JPY", locale: "ja-JP", currencyName: "Yen",     taxName: "Tax",   taxRate: 10,  continent: "Asia & Pacific" },
  "Malaysia":           { country: "Malaysia",           currency: "MYR", sym: "RM",  locale: "ms-MY", currencyName: "Ringgit", taxName: "SST",   taxRate: 6,   continent: "Asia & Pacific" },
  "Nepal":              { country: "Nepal",              currency: "NPR", sym: "NPR", locale: "ne-NP", currencyName: "Rupee",   taxName: "VAT",   taxRate: 13,  continent: "Asia & Pacific" },
  "New Zealand":        { country: "New Zealand",        currency: "NZD", sym: "NZ$", locale: "en-NZ", currencyName: "Dollar",  taxName: "GST",   taxRate: 15,  continent: "Asia & Pacific" },
  "Pakistan":           { country: "Pakistan",           currency: "PKR", sym: "PKR", locale: "ur-PK", currencyName: "Rupee",   taxName: "GST",   taxRate: 17,  continent: "Asia & Pacific" },
  "Philippines":        { country: "Philippines",        currency: "PHP", sym: "PHP", locale: "en-PH", currencyName: "Peso",    taxName: "VAT",   taxRate: 12,  continent: "Asia & Pacific" },
  "Singapore":          { country: "Singapore",          currency: "SGD", sym: "S$",  locale: "en-SG", currencyName: "Dollar",  taxName: "GST",   taxRate: 9,   continent: "Asia & Pacific" },
  "South Korea":        { country: "South Korea",        currency: "KRW", sym: "KRW", locale: "ko-KR", currencyName: "Won",     taxName: "VAT",   taxRate: 10,  continent: "Asia & Pacific" },
  "Sri Lanka":          { country: "Sri Lanka",          currency: "LKR", sym: "LKR", locale: "si-LK", currencyName: "Rupee",   taxName: "VAT",   taxRate: 15,  continent: "Asia & Pacific" },
  "Taiwan":             { country: "Taiwan",             currency: "TWD", sym: "NT$", locale: "zh-TW", currencyName: "Dollar",  taxName: "VAT",   taxRate: 5,   continent: "Asia & Pacific" },
  "Thailand":           { country: "Thailand",           currency: "THB", sym: "THB", locale: "th-TH", currencyName: "Baht",    taxName: "VAT",   taxRate: 7,   continent: "Asia & Pacific" },
  "Vietnam":            { country: "Vietnam",            currency: "VND", sym: "VND", locale: "vi-VN", currencyName: "Dong",    taxName: "VAT",   taxRate: 10,  continent: "Asia & Pacific" },
};

// ── MIDDLE EAST ───────────────────────────────────────────────
const MIDDLE_EAST: Record<string, LocaleConfig> = {
  "Bahrain":            { country: "Bahrain",            currency: "BHD", sym: "BD",  locale: "ar-BH", currencyName: "Dinar",   taxName: "VAT",   taxRate: 10,  continent: "Middle East" },
  "Iran":               { country: "Iran",               currency: "IRR", sym: "IRR", locale: "fa-IR", currencyName: "Rial",    taxName: "VAT",   taxRate: 9,   continent: "Middle East" },
  "Iraq":               { country: "Iraq",               currency: "IQD", sym: "IQD", locale: "ar-IQ", currencyName: "Dinar",   taxName: "VAT",   taxRate: 0,   continent: "Middle East" },
  "Israel":             { country: "Israel",             currency: "ILS", sym: "ILS", locale: "he-IL", currencyName: "Shekel",  taxName: "VAT",   taxRate: 17,  continent: "Middle East" },
  "Jordan":             { country: "Jordan",             currency: "JOD", sym: "JD",  locale: "ar-JO", currencyName: "Dinar",   taxName: "GST",   taxRate: 16,  continent: "Middle East" },
  "Kuwait":             { country: "Kuwait",             currency: "KWD", sym: "KD",  locale: "ar-KW", currencyName: "Dinar",   taxName: "VAT",   taxRate: 0,   continent: "Middle East" },
  "Lebanon":            { country: "Lebanon",            currency: "LBP", sym: "LBP", locale: "ar-LB", currencyName: "Pound",   taxName: "VAT",   taxRate: 11,  continent: "Middle East" },
  "Oman":               { country: "Oman",               currency: "OMR", sym: "OMR", locale: "ar-OM", currencyName: "Rial",    taxName: "VAT",   taxRate: 5,   continent: "Middle East" },
  "Qatar":              { country: "Qatar",              currency: "QAR", sym: "QR",  locale: "ar-QA", currencyName: "Riyal",   taxName: "VAT",   taxRate: 0,   continent: "Middle East" },
  "Saudi Arabia":       { country: "Saudi Arabia",       currency: "SAR", sym: "SR",  locale: "ar-SA", currencyName: "Riyal",   taxName: "VAT",   taxRate: 15,  continent: "Middle East" },
  "UAE":                { country: "UAE",                currency: "AED", sym: "AED", locale: "ar-AE", currencyName: "Dirham",  taxName: "VAT",   taxRate: 5,   continent: "Middle East" },
  "Yemen":              { country: "Yemen",              currency: "YER", sym: "YER", locale: "ar-YE", currencyName: "Rial",    taxName: "GCT",   taxRate: 5,   continent: "Middle East" },
};

// ── COMBINED MAP ──────────────────────────────────────────────
export const COUNTRY_LOCALE: Record<string, LocaleConfig> = {
  ...AFRICA,
  ...AMERICAS,
  ...EUROPE,
  ...ASIA_PACIFIC,
  ...MIDDLE_EAST,
};

export const DEFAULT_LOCALE: LocaleConfig = COUNTRY_LOCALE["South Africa"];

/** Returns the locale config for a country, falling back to South Africa. */
export function getLocale(country: string | null | undefined): LocaleConfig {
  if (!country) return DEFAULT_LOCALE;
  return COUNTRY_LOCALE[country] ?? DEFAULT_LOCALE;
}

/**
 * Returns a locale config with the currency symbol/code overridden.
 * Used when the user has chosen a currency different from their country default.
 */
export function getLocaleWithCurrencyOverride(
  country: string | null | undefined,
  currencyOverride: string | null | undefined
): LocaleConfig {
  const base = getLocale(country);
  if (!currencyOverride || currencyOverride === base.currency) return base;
  const match = Object.values(COUNTRY_LOCALE).find(l => l.currency === currencyOverride);
  if (!match) return base;
  return { ...base, currency: match.currency, sym: match.sym, currencyName: match.currencyName };
}

// ── GROUPED COUNTRIES for select dropdowns ────────────────────
export const AFRICA_TOP15 = [
  "Algeria", "Angola", "Cameroon", "Egypt", "Ethiopia",
  "Ghana", "Côte d'Ivoire", "Kenya", "Morocco", "Nigeria",
  "Senegal", "South Africa", "Tanzania", "Uganda", "Zimbabwe",
];

const africaTop15Set = new Set(AFRICA_TOP15);
const africaOther = Object.keys(AFRICA).filter(c => !africaTop15Set.has(c)).sort();

export const GROUPED_COUNTRIES: { label: string; countries: string[] }[] = [
  { label: "Africa — Key Markets",  countries: AFRICA_TOP15 },
  { label: "Africa — All Countries", countries: africaOther },
  { label: "Americas",               countries: Object.keys(AMERICAS).sort() },
  { label: "Europe",                 countries: Object.keys(EUROPE).sort() },
  { label: "Asia & Pacific",         countries: Object.keys(ASIA_PACIFIC).sort() },
  { label: "Middle East",            countries: Object.keys(MIDDLE_EAST).sort() },
];

/** All unique currencies for the currency override selector */
export const ALL_CURRENCIES: { code: string; sym: string; name: string }[] = Array.from(
  new Map(
    Object.values(COUNTRY_LOCALE).map(l => [l.currency, { code: l.currency, sym: l.sym, name: l.currencyName }])
  ).values()
).sort((a, b) => a.code.localeCompare(b.code));

/** Symbol lookup by currency code */
export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.values(COUNTRY_LOCALE).map(l => [l.currency, l.sym])
);
