import { useState, useEffect } from "react"
import { api } from "../utils/api"

const healthColor = (score) =>
  score >= 75 ? "text-green-700" : score >= 60 ? "text-amber-600" : "text-red-600"

export default function Advisor({ user }) {
  if (user.role === "advisor") return <AdvisorView />
  return <ClientView initiallyLinked={user.role === "client"} />
}

function AdvisorView() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchClients = () => api("/advisor/clients").then(result => setClients(Array.isArray(result) ? result : []))
  useEffect(() => { fetchClients() }, [])

  const generateInvite = async () => {
    setLoading(true)
    setError("")
    const result = await api("/advisor/invite", { method: "POST" })
    if (result.detail) {
      setError(result.detail)
    } else {
      setInvite(result)
    }
    setLoading(false)
  }

  if (selectedClient) {
    return <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Invite a client</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-6">
        {invite ? (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Share this code with your client</p>
            <p className="text-2xl font-mono font-semibold tracking-widest text-gray-900 dark:text-gray-50 mb-1">{invite.code}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Expires {invite.expires_at}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Generate a one-time code your client can enter to link their account to you.</p>
        )}
        <button onClick={generateInvite} disabled={loading} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium mt-3 disabled:opacity-50">
          {loading ? "Generating..." : invite ? "Generate a new code" : "Generate invite code"}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Your clients</p>
      {clients.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No clients linked yet</p>}
      {clients.map(c => (
        <button
          key={c.id}
          onClick={() => setSelectedClient(c)}
          className="w-full text-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 mb-2 flex justify-between items-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{c.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{c.email}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${healthColor(c.health_score)}`}>{c.health_score}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">R{c.total_debt.toLocaleString()} debt</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function ClientDetail({ client, onBack }) {
  const [dashboard, setDashboard] = useState(null)
  const [health, setHealth] = useState(null)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api(`/advisor/clients/${client.id}/dashboard`),
      api(`/advisor/clients/${client.id}/financial-health`),
      api(`/advisor/clients/${client.id}/loans`),
    ]).then(([d, h, l]) => {
      setDashboard(d && !d.detail ? d : null)
      setHealth(h && !h.detail ? h : null)
      setLoans(Array.isArray(l) ? l : [])
      setLoading(false)
    })
  }, [client.id])

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4">← Back to clients</button>

      <div className="mb-5">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{client.name}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{client.email}</p>
      </div>

      {loading && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Loading...</p>}

      {!loading && health && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-4 text-center">
          <p className={`text-4xl font-bold ${healthColor(health.overall)}`}>{health.overall}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{health.grade}</p>
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-left">
            <div className="text-gray-600 dark:text-gray-300">Debt: {health.debt_score}</div>
            <div className="text-gray-600 dark:text-gray-300">Savings: {health.savings_score}</div>
            <div className="text-gray-600 dark:text-gray-300">Budget: {health.budget_score}</div>
            <div className="text-gray-600 dark:text-gray-300">Emergency: {health.emergency_score}</div>
          </div>
        </div>
      )}

      {!loading && dashboard && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">Income (this month)</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">R{dashboard.total_income.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">Expenses (this month)</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">R{dashboard.total_expenses.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">Remaining</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">R{dashboard.remaining.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">Total debt</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">R{dashboard.total_debt.toLocaleString()}</p>
          </div>
        </div>
      )}

      {!loading && (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Loans</p>
          {loans.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No loans on record</p>}
          {loans.map(l => (
            <div key={l.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 mb-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{l.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">R{l.balance.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">R{l.monthly_payment.toLocaleString()}/month · {l.interest_rate}% interest</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientView({ initiallyLinked }) {
  const [linked, setLinked] = useState(initiallyLinked)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!code) return
    setLoading(true)
    setError("")
    const result = await api("/client/link-advisor", { method: "POST", body: JSON.stringify({ code }) })
    if (result.detail) {
      setError(result.detail)
    } else {
      setLinked(true)
    }
    setLoading(false)
  }

  if (linked) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">You're linked to an advisor</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">They'll be able to view your financial overview to help guide your planning.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Link your advisor</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">If your financial advisor gave you an invite code, enter it here to link your account.</p>
        <input
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 mb-3 tracking-widest font-mono uppercase"
          placeholder="INVITE CODE"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
        />
        <button onClick={submit} disabled={loading} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium disabled:opacity-50">
          {loading ? "Linking..." : "Link advisor"}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  )
}