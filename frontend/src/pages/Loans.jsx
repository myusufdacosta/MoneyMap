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
    await api(`/loans/${id}`, { method: "DELETE" })
    fetch()
  }

  const calcPayoff = (balance, monthlyPayment, annualRate, extra = 0) => {
    if (monthlyPayment <= 0) return { months: 0, totalInterest: 0 }
    const monthlyRate = annualRate / 100 / 12
    let remaining = balance
    let months = 0
    let totalInterest = 0
    const payment = monthlyPayment + extra

    if (monthlyRate === 0) {
      months = Math.ceil(balance / payment)
      return { months, totalInterest: 0 }
    }

    while (remaining > 0 && months < 1200) {
      const interest = remaining * monthlyRate
      totalInterest += interest
      remaining = remaining + interest - payment
      months++
      if (remaining < 0) remaining = 0
    }
    return { months, totalInterest: Math.round(totalInterest) }
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
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 mb-1">Total debt outstanding</p>
        <p className="text-2xl font-semibold text-amber-600">{fmt(totalDebt)}</p>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">Add loan</p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Loan name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Original amount (R)" type="number" value={orig} onChange={e => setOrig(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Current balance (R)" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Monthly payment (R)" type="number" value={payment} onChange={e => setPayment(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Interest rate (%)" type="number" value={rate} onChange={e => setRate(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium">Add loan</button>
      </div>

      {loans.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No loans added yet</p>}
      {loans.map(l => {
        const pct = Math.round(((l.original_amount - l.balance) / l.original_amount) * 100)
        const normal = calcPayoff(l.balance, l.monthly_payment, l.interest_rate)
        const isCalc = calculator === l.id
        const extra = parseFloat(extraPayment) || 0
        const withExtra = calcPayoff(l.balance, l.monthly_payment, l.interest_rate, extra)
        const monthsSaved = normal.months - withExtra.months
        const interestSaved = normal.totalInterest - withExtra.totalInterest

        return (
          <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                <p className="text-xs text-gray-400">{l.interest_rate}% interest · {fmt(l.monthly_payment)}/month</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(l)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => remove(l.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>

            {editing === l.id ? (
              <div className="space-y-2 mb-3">
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="New balance (R)" type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Monthly payment (R)" type="number" value={editPayment} onChange={e => setEditPayment(e.target.value)} />
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Interest rate (%)" type="number" value={editRate} onChange={e => setEditRate(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(l.id)} className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium">Save</button>
                  <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-500">Cancel</button>
                </div>
              </div>
            ) : null}

            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>{pct}% paid off</span>
              <span className="font-semibold text-amber-600">{fmt(l.balance)} remaining</span>
              <span>Free {getPayoffDate(normal.months)}</span>
            </div>

            <button
              onClick={() => { setCalculator(isCalc ? null : l.id); setExtraPayment("") }}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              {isCalc ? "Hide calculator" : "💡 What if I pay extra?"}
            </button>

            {isCalc && (
              <div className="mt-3 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Extra monthly payment (R)</p>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 bg-white"
                  placeholder="e.g. 500"
                  type="number"
                  value={extraPayment}
                  onChange={e => setExtraPayment(e.target.value)}
                />

                {extra > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-xs text-gray-500">Current payoff</span>
                      <span className="text-xs font-medium text-gray-900">{normal.months} months · {getPayoffDate(normal.months)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-xs text-gray-500">With extra {fmt(extra)}</span>
                      <span className="text-xs font-medium text-green-700">{withExtra.months} months · {getPayoffDate(withExtra.months)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-xs text-gray-500">Time saved</span>
                      <span className="text-xs font-semibold text-green-700">{monthsSaved} months sooner</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-gray-500">Interest saved</span>
                      <span className="text-xs font-semibold text-green-700">{fmt(interestSaved)}</span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-xs text-green-800 font-medium text-center">
                        Paying {fmt(extra)} extra saves you {fmt(interestSaved)} in interest and clears this loan {monthsSaved} months sooner!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}