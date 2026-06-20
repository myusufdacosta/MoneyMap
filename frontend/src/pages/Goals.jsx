import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [saved, setSaved] = useState("")
  const [deadline, setDeadline] = useState("")
  const [editing, setEditing] = useState(null)
  const [editSaved, setEditSaved] = useState("")

  const fetch = () => api("/savings-goals").then(setGoals)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!name || !target || !deadline) return
    await api("/savings-goals", { method: "POST", body: JSON.stringify({ name, target: parseFloat(target), saved: parseFloat(saved || 0), deadline }) })
    setName(""); setTarget(""); setSaved(""); setDeadline(""); fetch()
  }

  const updateSaved = async (goal) => {
    await api(`/savings-goals/${goal.id}`, { method: "PUT", body: JSON.stringify({ name: goal.name, target: goal.target, saved: parseFloat(editSaved), deadline: goal.deadline }) })
    setEditing(null); fetch()
  }

  const remove = async (id) => {
    await api(`/savings-goals/${id}`, { method: "DELETE" })
    fetch()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Add savings goal</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Goal name (Emergency fund, Holiday…)" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Target amount (R)" type="number" value={target} onChange={e => setTarget(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Already saved (R)" type="number" value={saved} onChange={e => setSaved(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Add goal</button>
      </div>

      {goals.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No savings goals yet</p>}
      {goals.map(g => {
        const pct = Math.min(Math.round((g.saved / g.target) * 100), 100)
        const remaining = g.target - g.saved
        return (
          <div key={g.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{g.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Target: {fmt(g.target)} · Deadline: {g.deadline}</p>
              </div>
              <button onClick={() => remove(g.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs">✕</button>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span className="text-green-700 font-medium">{fmt(g.saved)} saved</span>
              <span>{pct}%</span>
              <span className="text-amber-600 font-medium">{fmt(remaining)} to go</span>
            </div>
            {editing === g.id ? (
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Update saved amount (R)" type="number" value={editSaved} onChange={e => setEditSaved(e.target.value)} />
                <button onClick={() => updateSaved(g)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-4 py-2 text-sm">Save</button>
                <button onClick={() => setEditing(null)} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">✕</button>
              </div>
            ) : (
              <button onClick={() => { setEditing(g.id); setEditSaved(g.saved) }} className="text-xs text-blue-500 hover:text-blue-700">Update saved amount</button>
            )}
          </div>
        )
      })}
    </div>
  )
}