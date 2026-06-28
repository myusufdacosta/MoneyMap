import { useState, useEffect } from "react"
import { getUser, clearAuth, getDarkMode, setDarkModePref, api } from "./utils/api"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Income from "./pages/Income"
import Expenses from "./pages/Expenses"
import Loans from "./pages/Loans"
import Recurring from "./pages/Recurring"
import Goals from "./pages/Goals"
import Budget from "./pages/Budget"
import Strategy from "./pages/Strategy"
import Advisor from "./pages/Advisor"
import Onboarding from "./pages/Onboarding"

// Bottom nav icons as inline SVGs — no icon library needed
const icons = {
  overview: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  ),
  money: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  debt: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  goals: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clients: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

// Sub-navigation shown at the top when inside Money or Debt sections
function SubNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 px-4 pt-4 pb-1 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            active === t.id
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >{t.label}</button>
      ))}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(getUser())
  const [section, setSection] = useState("overview")
  const [moneyTab, setMoneyTab] = useState("expenses")
  const [debtTab, setDebtTab] = useState("loans")
  const [dark, setDark] = useState(getDarkMode())
  const [onboarding, setOnboarding] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    setDarkModePref(dark)
  }, [dark])

  useEffect(() => {
    if (!user || user.role === "advisor") { setOnboarding(false); return }
    api("/income").then(income => {
      setOnboarding(!income || income.length === 0)
    }).catch(() => setOnboarding(false))
  }, [user])

  const handleAuth = (u) => setUser(u)
  const handleLogout = () => { clearAuth(); setUser(null) }

if (!user) return <Login onAuth={handleAuth} />
if (onboarding === null) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )
    if (onboarding) return <Onboarding onComplete={() => setOnboarding(false)} />

  const isAdvisor = user.role === "advisor"

  // Advisor gets a simpler layout — just clients
  if (isAdvisor) {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-24">
        <div className="px-4 pt-8 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">MoneyMap</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hey {user.name} 👋</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setDark(d => !d)} className="text-xs text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">{dark ? "☀️" : "🌙"}</button>
            <button onClick={handleLogout} className="text-xs text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">Logout</button>
          </div>
        </div>
        <div className="px-4">
          <Advisor user={user} />
        </div>
      </div>
    )
  }

  const bottomNav = [
    { id: "overview", label: "Overview", icon: icons.overview },
    { id: "money",    label: "Money",    icon: icons.money },
    { id: "debt",     label: "Debt",     icon: icons.debt },
    { id: "goals",    label: "Goals",    icon: icons.goals },
  ]

  const moneyTabs = [
    { id: "expenses",  label: "Expenses" },
    { id: "income",    label: "Income" },
    { id: "budget",    label: "Budget" },
    { id: "recurring", label: "Recurring" },
  ]

  const debtTabs = [
    { id: "loans",    label: "My Loans" },
    { id: "strategy", label: "Payoff Plan" },
  ]

  // Page title per section
  const sectionTitle = {
    overview: "Overview",
    money: "Money",
    debt: "Debt",
    goals: "Goals & Advisor",
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* Header */}
      <div className="px-4 pt-8 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">MoneyMap</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{sectionTitle[section]}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setDark(d => !d)}
            className="text-xs text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5"
          >{dark ? "☀️" : "🌙"}</button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5"
          >Logout</button>
        </div>
      </div>

      {/* Sub-nav for Money and Debt sections */}
      {section === "money" && <SubNav tabs={moneyTabs} active={moneyTab} onChange={setMoneyTab} />}
      {section === "debt"  && <SubNav tabs={debtTabs}  active={debtTab}  onChange={setDebtTab} />}

      {/* Page content — extra bottom padding so content clears the nav bar */}
      <div className="px-4 py-4 pb-28">
        {section === "overview" && <Dashboard goTo={(page) => {
          // Allow Dashboard's "Payoff plan →" link to navigate to the debt section
          if (page === "strategy") { setSection("debt"); setDebtTab("strategy") }
          else if (page === "loans") { setSection("debt"); setDebtTab("loans") }
          else if (page === "expenses") { setSection("money"); setMoneyTab("expenses") }
          else if (page === "income") { setSection("money"); setMoneyTab("income") }
        }} />}
        {section === "money" && moneyTab === "expenses"  && <Expenses />}
        {section === "money" && moneyTab === "income"    && <Income />}
        {section === "money" && moneyTab === "budget"    && <Budget />}
        {section === "money" && moneyTab === "recurring" && <Recurring />}
        {section === "debt"  && debtTab === "loans"      && <Loans />}
        {section === "debt"  && debtTab === "strategy"   && <Strategy />}
        {section === "goals" && (
          <div className="space-y-6">
            <Goals />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Advisor</p>
              <Advisor user={user} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-lg bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex">
          {bottomNav.map(item => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                  active
                    ? "text-gray-900 dark:text-gray-50"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {item.icon(active)}
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-gray-900 dark:bg-gray-50 mt-0.5" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}