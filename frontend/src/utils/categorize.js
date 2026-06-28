// Instant, offline category + Need/Want suggestions for manual expense entry,
// based on common South African merchants. No API call — pure keyword matching
// against the description as the person types. Mirrors the same category
// scheme and Need/Want defaults used by the AI receipt scanner on the backend,
// so suggestions stay consistent whether an expense comes from scanning or
// typing it in by hand.

const RULES = [
  { category: "Groceries", type: "Need", keywords: ["checkers", "woolworths", "woolies", "pick n pay", "pnp", "shoprite", "spar", "food lover", "boxer", "usave", "fruit & veg", "fruit and veg"] },
  { category: "Transport", type: "Need", keywords: ["uber", "bolt", "gautrain", "myciti", "engen", "shell", "sasol", "caltex", "total garage", "garage", "petrol", "diesel", "fuel", "toll", "sanral", "parking", "metrorail", "golden arrow", "taxi"] },
  { category: "Utilities", type: "Need", keywords: ["eskom", "city power", "prepaid electricity", "municipal", "municipality", "rates", "water board", "telkom", "vodacom", "mtn", "cell c", "rain", "fibre", "wifi", "airtime", "data bundle"] },
  { category: "Entertainment", type: "Want", keywords: ["netflix", "dstv", "showmax", "spotify", "ster-kinekor", "sterkinekor", "nu metro", "numetro", "youtube premium", "apple music", "playstation", "xbox", "steam"] },
  { category: "Medical", type: "Need", keywords: ["clicks", "dis-chem", "dischem", "pharmacy", "doctor", "dentist", "discovery health", "bonitas", "momentum health", "medical aid", "gems", "optometrist", "specsavers"] },
  { category: "Loan Payment", type: "Need", keywords: ["loan", "capitec credit", "african bank", "directaxis", "wesbank", "mfc", "edgars", "mr price account", "foschini", "truworths", "jet account", "bond", "home loan", "vehicle finance", "instalment"] },
  { category: "Rent", type: "Need", keywords: ["rent", "landlord", "property management", "rental"] },
{ category: "Takeaways", type: "Want", keywords: ["mcdonald", "kfc", "nando", "steers", "debonairs", "mr d", "mr delivery", "uber eats", "romans pizza", "chicken licken", "wimpy", "spur", "ocean basket"] },
  { category: "Bank Charges", type: "Need", keywords: ["service fee", "account fee", "bank charge", "card fee", "transaction fee", "atm fee", "cash handling", "monthly fee", "administration fee", "fnb fee", "absa fee", "nedbank fee", "standard bank fee", "capitec fee"] },
]

// Returns { category, type } for the first matching keyword, or null if nothing matched.
export const suggestCategory = (description) => {
  if (!description) return null
  const text = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return { category: rule.category, type: rule.type }
    }
  }
  return null
}