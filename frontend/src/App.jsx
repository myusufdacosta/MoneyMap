import { useState, useEffect } from "react"
import { getUser, clearAuth, getDarkMode, setDarkModePref } from "./utils/api"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Income from "./pages/Income"
import Expenses from "./pages/Expenses"
import Loans from "./pages/Loans"
import Recurring from "./pages/Recurring"
import Goals from "./pages/Goals"
import Budget from "./pages/Budget"
import Strategy from "./pages/Strategy"

export default function App() {
  const [user, setUser] = useState(getUser())
  const [tab, setTab] = useState("dashboard")
  const [dark, setDark] = useState(getDarkMode())

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    setDarkModePref(dark)
  }, [dark])

  const handleAuth = (u) => setUser(u)
  const handleLogout = () => { clearAuth(); setUser(null) }

  if (!user) return <Login onAuth={handleAuth} />

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "income", label: "Income" },
    { id: "expenses", label: "Expenses" },
    { id: "loans", label: "Loans" },
    { id: "recurring", label: "Recurring" },
    { id: "budget", label: "Budget" },
    { id: "goals", label: "Goals" },
    { id: "strategy", label: "Payoff Plan" },
  ]

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="px-4 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">MoneyMap</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hey {user.name} 👋</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setDark(d => !d)}
            className="text-xs text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5"
            title="Toggle dark mode"
          >{dark ? "☀️ Light" : "🌙 Dark"}</button>
          <button onClick={handleLogout} className="text-xs text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">Logout</button>
        </div>
      </div>

      <nav className="flex border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 py-3 px-2 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-b-2 border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >{t.label}</button>
        ))}
      </nav>

      <div className="px-4 py-5">
        {tab === "dashboard" && <Dashboard />}
        {tab === "income" && <Income />}
        {tab === "expenses" && <Expenses />}
        {tab === "loans" && <Loans />}
        {tab === "recurring" && <Recurring />}
        {tab === "budget" && <Budget />}
        {tab === "goals" && <Goals />}
        {tab === "strategy" && <Strategy />}
      </div>
    </div>
  )
}