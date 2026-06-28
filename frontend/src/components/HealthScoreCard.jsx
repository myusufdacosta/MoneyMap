const diagnose = (data) => {
  const issues = [
    { score: data.debt_score,      label: "debt repayments are eating too much of your income" },
    { score: data.savings_score,   label: "you're not putting enough away in savings" },
    { score: data.budget_score,    label: "too much spending is going on wants vs needs" },
    { score: data.emergency_score, label: "your emergency fund needs attention" },
  ].filter(i => i.score < 60).sort((a, b) => a.score - b.score)

  if (issues.length === 0) return "Your finances are in great shape — keep it up."
  if (issues.length === 1) return `Your main issue: ${issues[0].label}.`
  return `Two things to fix: ${issues[0].label}, and ${issues[1].label}.`
}

const ScoreBar = ({ label, score }) => {
  const color = score >= 75 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-400"
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{score}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function HealthScoreCard({ data, prevData }) {
  const color = data.overall >= 75 ? "text-green-700" : data.overall >= 60 ? "text-amber-500" : "text-red-500"
  const ringColor = data.overall >= 75 ? "border-green-500" : data.overall >= 60 ? "border-amber-400" : "border-red-400"
  const diagnosis = diagnose(data)

  const delta = prevData ? data.overall - prevData.overall : null
  const deltaText = delta === null ? null
    : delta === 0 ? "Same as last month"
    : delta > 0 ? `↑${delta} pts vs last month`
    : `↓${Math.abs(delta)} pts vs last month`
  const deltaColor = delta === null || delta === 0 ? "text-gray-400"
    : delta > 0 ? "text-green-600" : "text-red-500"

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 mb-5">
      <div className="flex items-center gap-5 mb-4">
        <div className={`w-20 h-20 rounded-full border-4 ${ringColor} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-3xl font-bold leading-none ${color}`}>{data.overall}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">/100</span>
        </div>
        <div>
          <p className={`text-lg font-bold ${color}`}>{data.grade}</p>
          {deltaText && <p className={`text-xs font-medium ${deltaColor} mb-1`}>{deltaText}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{diagnosis}</p>
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <ScoreBar label="Debt load" score={data.debt_score} />
        <ScoreBar label="Savings rate" score={data.savings_score} />
        <ScoreBar label="Budget discipline" score={data.budget_score} />
        <ScoreBar label="Emergency fund" score={data.emergency_score} />
      </div>
    </div>
  )
}