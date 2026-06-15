import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Income() {
  const [income, setIncome] = useState([])
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const fetch = () => api("/income").then(setIncome)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!source || !amount || !date) return
    await api("/income", { method: "POST", body: JSON.stringify({ source, amount: parseFloat(amount), date }) })
    setSource(""); setAmount(""); fetch()
  }

  const remove = async (id) => {
    await api(`/income/${id}`, { method: "DELETE" })
    fetch()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const total = income.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 mb-1">Total this month</p>
        <p className="text-2xl font-semibold text-green-700">{fmt(total)}</p>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">Add income</p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Source (Salary, side hustle…)" value={source} onChange={e => setSource(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Amount (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium">Add income</button>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">History</p>
      {income.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No income added yet</p>}
      {income.map(i => (
        <div key={i.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 mb-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{i.source}</p>
            <p className="text-xs text-gray-400">{i.date}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-green-700">{fmt(i.amount)}</span>
            <button onClick={() => remove(i.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}