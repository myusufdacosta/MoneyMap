import { useState } from "react"
import { api, setAuth } from "../utils/api"

export default function Login({ onAuth }) {
  const [mode, setMode] = useState("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAdvisor, setIsAdvisor] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) return
    if (mode === "register" && !name) return
    setLoading(true)
    setError("")
    try {
      const endpoint = mode === "login" ? "/login" : "/register"
      const body = mode === "login"
        ? { name: "", email, password }
        : { name, email, password, is_advisor: isAdvisor }
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (data.access_token) {
        setAuth(data.access_token, data.user)
        onAuth(data.user)
      } else {
        setError(data.detail || "Something went wrong")
      }
    } catch {
      setError("Could not connect to server")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">MoneyMap</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your money, beat your debt</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "login" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
            >Login</button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "register" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
            >Sign up</button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <input
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            )}
            <input
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 text-sm"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
            {mode === "register" && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 px-1">
                <input type="checkbox" checked={isAdvisor} onChange={e => setIsAdvisor(e.target.checked)} className="rounded" />
                I'm a financial advisor
              </label>
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl py-3 text-sm font-medium mt-4 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  )
}