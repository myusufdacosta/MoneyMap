import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Loans() {
  const [loans, setLoans] = useState([])
  const [name, setName] = useState("")
  const [orig, setOrig] = useState("")
  const [balance, setBalance] = useState("")
  const [payment, setPayment] = useState("")
  const [rate, setRate] = useState("")
  const [editing, setEditing] = useState(null)
  const [editBalance, setEditBalance] = useState("")
  const [editPayment, setEditPayment] = useState("")
  const [editRate, setEditRate] = useState("")
  const [calculator, setCalculator] = useState(null)
  const [extraPayment, setExtraPayment] = useState("")

  const fetch = () => api("/loans").then(setLoans)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!name || !orig || !balance || !payment) return
    await api("/loans", { method: "POST", body: JSON.stringify({ name, original_amount: parseFloat(orig), balance: parseFloat(balance), monthly_payment: parseFloat(payment), interest_rate: parseFloat(rate || 0) }) })
    setName(""); setOrig(""); setBalance(""); setPayment(""); setRate(""); fetch()
  }

  const startEdit = (l) => {
    setEditing(l.id)
    setEditBalance(l.balance)
    setEditPayment(l.monthly_payment)
    setEditRate(l.interest_rate)
  }

  const saveEdit = async (id) => {
    await api(`/loans/${id}`, { method: "PUT", body: JSON.stringify({ balance: parseFloat(editBalance), monthly_payment: parseFloat(editPayment), interest_rate: parseFloat(editRate) }) })
    setEditing(null); fetch()
  }

  const remove = async (id) => {
    const item = loans.find(l => l.id === id)
    if (!window.confirm(`Delete "${item?.name ?? "this loan"}"? This can't be undone.`)) return
    await api(`/loans/${id}`, { method: "DELETE" })
    fetch()
  }

  // Returns { months, totalInterest, neverPaidOff }.
  // If the payment doesn't cover the first month's interest, the balance
  // (and the interest it generates) can only grow — that case would
  // otherwise loop to the 1200-month safety cap and return a meaningless
  // number, so we flag it instead.
  const calcPayoff = (balance, monthlyPayment, annualRate, extra = 0) => {
    const payment = monthlyPayment + extra
    if (payment <= 0) return { months: null, totalInterest: null, neverPaidOff: true }

    const monthlyRate = annualRate / 100 / 12
    if (monthlyRate === 0) {
      return { months: Math.ceil(balance / payment), totalInterest: 0, neverPaidOff: false }
    }

    const firstInterest = balance * monthlyRate
    if (payment <= firstInterest) {
      return { months: null, totalInterest: null, neverPaidOff: true }
    }

    let remaining = balance
    let months = 0
    let totalInterest = 0
    while (remaining > 0 && months < 1200) {
      const interest = remaining * monthlyRate
      totalInterest += interest
      remaining = remaining + interest - payment
      months++
      if (remaining < 0) remaining = 0
    }
    return { months, totalInterest: Math.round(totalInterest), neverPaidOff: false }
  }

  const getPayoffDate = (months) => {
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const totalDebt = loans.reduce((s, l) => s + l.balance, 0)

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total debt outstanding</p>
        <p className="text-2xl font-semibold text-amber-600">{fmt(totalDebt)}</p>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Add loan</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Loan name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Original amount (R)" type="number" value={orig} onChange={e => setOrig(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Current balance (R)" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Monthly payment (R)" type="number" value={payment} onChange={e => setPayment(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Interest rate (%)" type="number" value={rate} onChange={e => setRate(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Add loan</button>
      </div>

      {loans.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No loans added yet</p>}
      {loans.map(l => {
        const pct = Math.round(((l.original_amount - l.balance) / l.original_amount) * 100)
        const normal = calcPayoff(l.balance, l.monthly_payment, l.interest_rate)
        const isCalc = calculator === l.id
        const extra = parseFloat(extraPayment) || 0
        const withExtra = calcPayoff(l.balance, l.monthly_payment, l.interest_rate, extra)
        const monthsSaved = !normal.neverPaidOff && !withExtra.neverPaidOff ? normal.months - withExtra.months : null
        const interestSaved = !normal.neverPaidOff && !withExtra.neverPaidOff ? normal.totalInterest - withExtra.totalInterest : null
        const minToBreakEven = Math.ceil(l.balance * (l.interest_rate / 100 / 12))

        return (
          <div key={l.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{l.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{l.interest_rate}% interest · {fmt(l.monthly_payment)}/month</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(l)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => remove(l.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>

            {editing === l.id ? (
              <div className="space-y-2 mb-3">
                <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="New balance (R)" type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Monthly payment (R)" type="number" value={editPayment} onChange={e => setEditPayment(e.target.value)} />
                <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Interest rate (%)" type="number" value={editRate} onChange={e => setEditRate(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(l.id)} className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Save</button>
                  <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400">Cancel</button>
                </div>
              </div>
            ) : null}

            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>{pct}% paid off</span>
              <span className="font-semibold text-amber-600">{fmt(l.balance)} remaining</span>
              {normal.neverPaidOff
                ? <span className="font-semibold text-red-600">⚠️ Growing, not shrinking</span>
                : <span>Free {getPayoffDate(normal.months)}</span>}
            </div>

            {normal.neverPaidOff && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-red-700 dark:text-red-400">
                  {fmt(l.monthly_payment)}/month doesn't cover this loan's {l.interest_rate}% interest, so the balance is increasing instead of shrinking. You'd need at least {fmt(minToBreakEven)}/month just to stop it growing.
                </p>
              </div>
            )}

            <button
              onClick={() => { setCalculator(isCalc ? null : l.id); setExtraPayment("") }}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              {isCalc ? "Hide calculator" : "💡 What if I pay extra?"}
            </button>

            {isCalc && (
              <div className="mt-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Extra monthly payment (R)</p>
                <input
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g. 500"
                  type="number"
                  value={extraPayment}
                  onChange={e => setExtraPayment(e.target.value)}
                />

                {extra > 0 && (
                  withExtra.neverPaidOff ? (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                        Even with {fmt(extra)} extra, it still doesn't cover the interest. Try a bigger amount — you need at least {fmt(minToBreakEven)}/month in total just to break even.
                      </p>
                    </div>
                  ) : normal.neverPaidOff ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">With extra {fmt(extra)}</span>
                        <span className="text-xs font-medium text-green-700">{withExtra.months} months · {getPayoffDate(withExtra.months)}</span>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 mt-2">
                        <p className="text-xs text-green-800 font-medium text-center">
                          That extra {fmt(extra)} turns this loan around — instead of growing forever, it's paid off in {withExtra.months} months.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Current payoff</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-50">{normal.months} months · {getPayoffDate(normal.months)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">With extra {fmt(extra)}</span>
                        <span className="text-xs font-medium text-green-700">{withExtra.months} months · {getPayoffDate(withExtra.months)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Time saved</span>
                        <span className="text-xs font-semibold text-green-700">{monthsSaved} months sooner</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Interest saved</span>
                        <span className="text-xs font-semibold text-green-700">{fmt(interestSaved)}</span>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 mt-2">
                        <p className="text-xs text-green-800 font-medium text-center">
                          Paying {fmt(extra)} extra saves you {fmt(interestSaved)} in interest and clears this loan {monthsSaved} months sooner!
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}