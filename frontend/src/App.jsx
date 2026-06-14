import { useState } from "react"
import Dashboard from "./pages/Dashboard"
import Income from "./pages/Income"
import Expenses from "./pages/Expenses"
import Loans from "./pages/Loans"
import Recurring from "./pages/Recurring"

export default function App() {
  const [tab, setTab] = useState("dashboard")

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "income", label: "Income" },
    { id: "expenses", label: "Expenses" },
    { id: "loans", label: "Loans" },
    { id: "recurring", label: "Recurring" },
  ]

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-gray-900">MoneyMap</h1>
        <p className="text-sm text-gray-500">Track your money, beat your debt</p>
      </div>

      <nav className="flex border-b border-gray-200 px-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-5">
        {tab === "dashboard" && <Dashboard />}
        {tab === "income" && <Income />}
        {tab === "expenses" && <Expenses />}
        {tab === "loans" && <Loans />}
        {tab === "recurring" && <Recurring />}
      </div>
    </div>
  )
}