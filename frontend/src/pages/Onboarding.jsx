import { useState } from "react"
import { api } from "../utils/api"

const steps = [
  {
    id: "income",
    emoji: "💰",
    title: "What's your monthly income?",
    subtitle: "Add your take-home salary or any regular income. This is the foundation of your financial picture.",
    cta: "Add income",
  },
  {
    id: "loan",
    emoji: "🏦",
    title: "Do you have any debt?",
    subtitle: "Add your biggest loan — car finance, credit card, personal loan. You can add more later.",
    cta: "Add loan",
    skip: "I have no debt",
  },
  {
    id: "goal",
    emoji: "🎯",
    title: "Set your first savings goal",
    subtitle: "An emergency fund, a holiday, a deposit — pick something that matters to you.",
    cta: "Set goal",
    skip: "Skip for now",
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [incomeSource, setIncomeSource] = useState("Salary")
  const [incomeAmount, setIncomeAmount] = useState("")

  const [loanName, setLoanName] = useState("")
  const [loanBalance, setLoanBalance] = useState("")
  const [loanPayment, setLoanPayment] = useState("")
  const [loanRate, setLoanRate] = useState("")

  const [goalName, setGoalName] = useState("")
  const [goalTarget, setGoalTarget] = useState("")

  const today = new Date().toISOString().slice(0, 10)
  const current = steps[step]
  const progress = ((step) / steps.length) * 100

  const handleSubmit = async () => {
    setError("")
    setSaving(true)
    try {
      if (current.id === "income") {
        if (!incomeAmount || parseFloat(incomeAmount) <= 0) { setError("Please enter a valid amount."); setSaving(false); return }
        await api("/income", { method: "POST", body: JSON.stringify({ source: incomeSource || "Salary", amount: parseFloat(incomeAmount), date: today }) })
      } else if (current.id === "loan") {
        if (!loanName || !loanBalance || parseFloat(loanBalance) <= 0) { setError("Please enter the loan name and balance."); setSaving(false); return }
        await api("/loans", { method: "POST", body: JSON.stringify({ name: loanName, original_amount: parseFloat(loanBalance), balance: parseFloat(loanBalance), monthly_payment: parseFloat(loanPayment) || 0, interest_rate: parseFloat(loanRate) || 0 }) })
      } else if (current.id === "goal") {
        if (!goalName || !goalTarget || parseFloat(goalTarget) <= 0) { setError("Please enter a goal name and target amount."); setSaving(false); return }
        await api("/savings-goals", { method: "POST", body: JSON.stringify({ name: goalName, target: parseFloat(goalTarget), saved: 0, deadline: "" }) })
      }
      nextStep()
    } catch { setError("Something went wrong. Try again.") }
    setSaving(false)
  }

  const nextStep = () => {
    if (step < steps.length - 1) { setStep(s => s + 1); setError("") }
    else { onComplete() }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col max-w-lg mx-auto px-6 pt-16 pb-12">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-12">
        <div className="bg-gray-900 dark:bg-gray-100 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Step {step + 1} of {steps.length}</p>
      <div className="text-5xl mb-4">{current.emoji}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{current.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">{current.subtitle}</p>

      {current.id === "income" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Source</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. Salary, Freelance" value={incomeSource} onChange={e => setIncomeSource(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Monthly amount (R)</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. 25000" type="number" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} autoFocus />
          </div>
        </div>
      )}

      {current.id === "loan" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Loan name</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. Car Finance, FNB Credit Card" value={loanName} onChange={e => setLoanName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Outstanding balance (R)</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. 80000" type="number" value={loanBalance} onChange={e => setLoanBalance(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Monthly payment (R)</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. 3000" type="number" value={loanPayment} onChange={e => setLoanPayment(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Interest rate (%)</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. 11.5" type="number" value={loanRate} onChange={e => setLoanRate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {current.id === "goal" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Goal name</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. Emergency Fund, Holiday, Deposit" value={goalName} onChange={e => setGoalName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Target amount (R)</label>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="e.g. 10000" type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

      <div className="mt-8 space-y-3">
        <button onClick={handleSubmit} disabled={saving} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50">
          {saving ? "Saving..." : current.cta}
        </button>
        {current.skip && (
          <button onClick={nextStep} className="w-full text-sm text-gray-400 dark:text-gray-500 py-2">{current.skip}</button>
        )}
      </div>
    </div>
  )
}