export default function QuickWinsCard({ recommendations }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-6">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-4">
        Quick Wins
      </p>

      <div className="space-y-3">
        {recommendations.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="text-lg">💡</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}