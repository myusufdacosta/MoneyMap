import { useState } from "react"
import { getUser, clearAuth } from "./utils/api"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Income from "./pages/Income"
import Expenses from "./pages/Expenses"
import Loans from "./pages/Loans"
import Recurring from "./pages/Recurring"
import Goals from "./pages/Goals"
import Budget from "./pages/Budget"

export default function App() {
  const [user, setUser] = useState(getUser())
  const [tab, setTab] = useState("dashboard")

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
  ]

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white">
      <div className="px-4 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">MoneyMap</h1>
          <p className="text-sm text-gray-500">Hey {user.name} 👋</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 mt-1 border border-gray-200 rounded-lg px-3 py-1.5">Logout</button>
      </div>

      <nav className="flex border-b border-gray-200 px-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 py-3 px-2 text-xs font-medium transition-colors ${
              tab === t.id ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-400 hover:text-gray-600"
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
      </div>
    </div>
  )
}