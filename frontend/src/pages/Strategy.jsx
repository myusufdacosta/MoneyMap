import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Strategy() {
  const [loans, setLoans] = useState([])
  const [extra, setExtra] = useState("")
  const [view, setView] = useState("avalanche")

  useEffect(() => { api("/loans").then(setLoans) }, [])

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`

  const getPayoffDate = (months) => {
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
  }

  // Simulates paying off all loans together using either the avalanche
  // (highest interest first) or snowball (smallest balance first) method.
  // Once a loan is cleared, its minimum payment "snowballs" onto the next one.
  const simulate = (strategy, extraAmount) => {
    let working = loans.map(l => ({ ...l, remaining: l.balance, paidOffMonth: null }))
    working.sort(strategy === "avalanche"
      ? (a, b) => b.interest_rate - a.interest_rate
      : (a, b) => a.balance - b.balance)

    let month = 0
    let totalInterest = 0
    let freedUp = 0
    const payoffOrder = []
    const maxMonths = 1200

    while (working.some(l => l.remaining > 0) && month < maxMonths) {
      month++

      working.forEach(l => {
        if (l.remaining > 0) {
          const interest = l.remaining * (l.interest_rate / 100 / 12)
          totalInterest += interest
          l.remaining += interest
        }
      })

      working.forEach(l => {
        if (l.remaining > 0) {
          const pay = Math.min(l.monthly_payment, l.remaining)
          l.remaining -= pay
        }
      })

      let availableExtra = extraAmount + freedUp
      for (const l of working) {
        if (availableExtra <= 0) break
        if (l.remaining <= 0) continue
        const pay = Math.min(availableExtra, l.remaining)
        l.remaining -= pay
        availableExtra -= pay
      }

      working.forEach(l => {
        if (l.remaining <= 0 && l.paidOffMonth === null) {
          l.paidOffMonth = month
          freedUp += l.monthly_payment
          payoffOrder.push({ name: l.name, month, date: getPayoffDate(month) })
        }
      })
    }

    return { totalMonths: month, totalInterest: Math.round(totalInterest), payoffOrder }
  }

  // Baseline: each loan paid off independently on its own minimum, no extra,
  // nothing redirected when one clears — i.e. what happens if nothing changes.
  const baseline = (() => {
    let totalMonths = 0
    let totalInterest = 0
    loans.forEach(l => {
      let remaining = l.balance
      let m = 0
      const rate = l.interest_rate / 100 / 12
      while (remaining > 0 && m < 1200) {
        const interest = remaining * rate
        totalInterest += interest
        remaining += interest
        const pay = Math.min(l.monthly_payment, remaining)
        remaining -= pay
        m++
      }
      totalMonths = Math.max(totalMonths, m)
    })
    return { totalMonths, totalInterest: Math.round(totalInterest) }
  })()

  if (loans.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Add some loans first to build a payoff plan</p>
  }

  const extraAmount = parseFloat(extra) || 0
  const avalanche = simulate("avalanche", extraAmount)
  const snowball = simulate("snowball", extraAmount)
  const active = view === "avalanche" ? avalanche : snowball

  const totalMinimum = loans.reduce((s, l) => s + l.monthly_payment, 0)
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0)
  const monthsSaved = Math.max(baseline.totalMonths - active.totalMonths, 0)
  const interestSaved = Math.max(baseline.totalInterest - active.totalInterest, 0)

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total debt across {loans.length} loan{loans.length > 1 ? "s" : ""}</p>
        <p className="text-2xl font-semibold text-amber-600">{fmt(totalDebt)}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Minimum payments: {fmt(totalMinimum)}/month</p>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Extra you can put toward debt each month</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5">
        <input
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. 500"
          type="number"
          value={extra}
          onChange={e => setExtra(e.target.value)}
        />
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">If you change nothing</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Debt-free by</span>
          <span className="font-medium text-gray-900 dark:text-gray-50">{getPayoffDate(baseline.totalMonths)} · {baseline.totalMonths} months</span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-gray-500 dark:text-gray-400">Total interest paid</span>
          <span className="font-medium text-red-600">{fmt(baseline.totalInterest)}</span>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Pick a strategy</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setView("avalanche")}
          className={`text-left rounded-xl p-4 border transition-colors ${view === "avalanche" ? "border-gray-900 dark:border-gray-50 bg-gray-50 dark:bg-gray-800" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50"}`}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Avalanche</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Highest interest rate first. Saves the most money.</p>
          <p className="text-sm font-semibold text-green-700">{fmt(avalanche.totalInterest)} interest</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{avalanche.totalMonths} months</p>
        </button>
        <button
          onClick={() => setView("snowball")}
          className={`text-left rounded-xl p-4 border transition-colors ${view === "snowball" ? "border-gray-900 dark:border-gray-50 bg-gray-50 dark:bg-gray-800" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50"}`}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Snowball</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Smallest balance first. Builds momentum fastest.</p>
          <p className="text-sm font-semibold text-green-700">{fmt(snowball.totalInterest)} interest</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{snowball.totalMonths} months</p>
        </button>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
        <p className="text-xs text-green-800 dark:text-green-300 font-medium text-center">
          {view === "avalanche" ? "Avalanche" : "Snowball"} gets you debt-free {monthsSaved} months sooner and saves {fmt(interestSaved)} in interest, versus paying only the minimums.
        </p>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Payoff order — {view === "avalanche" ? "Avalanche" : "Snowball"}</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
        {active.payoffOrder.map((p, i) => (
          <div key={p.name + i} className={`flex justify-between items-center px-4 py-3 ${i !== active.payoffOrder.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-5">{i + 1}</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{p.name}</p>
            </div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{p.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}