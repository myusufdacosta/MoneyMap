import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get(`${API}/dashboard`).then(r => setData(r.data))
  }, [])

  if (!data) return <p className="text-gray-400 text-sm">Loading...</p>

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const leakageColor = data.leakage_pct < 15 ? "text-green-700" : data.leakage_pct < 30 ? "text-amber-600" : "text-red-600"
  const needsPct = data.total_expenses > 0 ? (data.needs / data.total_expenses) * 100 : 50

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Income</p>
          <p className="text-xl font-semibold text-green-700">{fmt(data.total_income)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-xl font-semibold text-red-600">{fmt(data.total_expenses)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className={`text-xl font-semibold ${data.remaining >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(data.remaining)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total debt</p>
          <p className="text-xl font-semibold text-amber-600">{fmt(data.total_debt)}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">Budget leakage</p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
        <div className="flex rounded-full overflow-hidden h-3 mb-3">
          <div className="bg-green-500" style={{ width: `${needsPct}%` }}></div>
          <div className="bg-red-400" style={{ width: `${100 - needsPct}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span className="text-green-700 font-medium">{fmt(data.needs)} needs</span>
          <span className={`font-semibold ${leakageColor}`}>{data.leakage_pct}% leakage</span>
          <span className="text-red-600 font-medium">{fmt(data.wants)} wants</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Monthly recurring</p>
        <p className="text-xl font-semibold text-blue-700">{fmt(data.total_recurring)}</p>
      </div>
    </div>
  )
}