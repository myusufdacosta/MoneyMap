import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

export default function Loans() {
  const [loans, setLoans] = useState([])
  const [name, setName] = useState("")
  const [orig, setOrig] = useState("")
  const [balance, setBalance] = useState("")
  const [payment, setPayment] = useState("")
  const [rate, setRate] = useState("")

  const fetch = () => axios.get(`${API}/loans`).then(r => setLoans(r.data))
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!name || !orig || !balance || !payment) return
    await axios.post(`${API}/loans`, {
      name, original_amount: parseFloat(orig), balance: parseFloat(balance),
      monthly_payment: parseFloat(payment), interest_rate: parseFloat(rate || 0)
    })
    setName(""); setOrig(""); setBalance(""); setPayment(""); setRate(""); fetch()
  }

  const remove = async (id) => {
    await axios.delete(`${API}/loans/${id}`)
    fetch()
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
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Loan name (Capitec, FNB…)" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Original amount (R)" type="number" value={orig} onChange={e => setOrig(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Current balance (R)" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Monthly payment (R)" type="number" value={payment} onChange={e => setPayment(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Interest rate (%)" type="number" value={rate} onChange={e => setRate(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium">Add loan</button>
      </div>

      {loans.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No loans added yet</p>}
      {loans.map(l => {
        const pct = Math.round(((l.original_amount - l.balance) / l.original_amount) * 100)
        const months = l.monthly_payment > 0 ? Math.ceil(l.balance / l.monthly_payment) : 0
        return (
          <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                <p className="text-xs text-gray-400">{l.interest_rate}% interest · {fmt(l.monthly_payment)}/month</p>
              </div>
              <button onClick={() => remove(l.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{pct}% paid off</span>
              <span className="font-semibold text-amber-600">{fmt(l.balance)} remaining</span>
              <span>~{months} months left</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}