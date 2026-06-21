export default function HealthScoreCard({ data }) {
  const colour =
    data.overall >= 75
      ? "text-green-700"
      : data.overall >= 60
      ? "text-amber-600"
      : "text-red-600"

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-6">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">
        Financial Health
      </p>

      <div className="text-center">
        <p className={`text-5xl font-bold ${colour}`}>
          {data.overall}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data.grade}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 text-xs">
        <div className="text-gray-600 dark:text-gray-300">
          Debt: {data.debt_score}
        </div>

        <div className="text-gray-600 dark:text-gray-300">
          Savings: {data.savings_score}
        </div>

        <div className="text-gray-600 dark:text-gray-300">
          Budget: {data.budget_score}
        </div>

        <div className="text-gray-600 dark:text-gray-300">
          Emergency: {data.emergency_score}
        </div>
      </div>
    </div>
  )
}