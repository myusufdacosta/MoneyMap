import { useState, useRef } from "react"
import { api } from "../utils/api"

const CATEGORIES = ["Groceries","Transport","Utilities","Entertainment","Medical","Loan Payment","Rent","Takeaways", "Bank Charges", "Other"]

// Shrinks the photo client-side before it ever leaves the phone — receipts
// don't need full camera resolution for the AI to read them, and this keeps
// uploads fast on mobile data and well under any request-size limits.
const resizeImage = (file, maxDim = 1600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.onerror = () => reject(new Error("Could not read that image"))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error("Could not read that file"))
    reader.readAsDataURL(file)
  })
}

// PDFs can't be drawn onto a canvas like an image (no decoding step needed
// here at all) — just read the raw bytes as a base64 data URL and let the
// backend render the pages.
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error("Could not read that file"))
    reader.readAsDataURL(file)
  })
}

export default function ScanReceipt({ onAdded }) {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState("idle") // idle | scanning | review | saving
  const [error, setError] = useState("")
  const [transactions, setTransactions] = useState([])
  const [docType, setDocType] = useState("receipt")
  const [truncated, setTruncated] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setStatus("scanning")
    setError("")
    try {
      const isPdf = file.type === "application/pdf"
      const dataUrl = isPdf ? await readFileAsDataUrl(file) : await resizeImage(file)
      const result = await api("/scan-receipt", { method: "POST", body: JSON.stringify({ file: dataUrl }) })
      if (result.detail) {
        setError(result.detail)
        setStatus("idle")
        return
      }
      setTransactions(result.transactions.map((t, i) => ({ ...t, _id: i })))
      setDocType(result.document_type || "receipt")
      setTruncated(!!result.truncated)
      setStatus("review")
    } catch {
      setError("Something went wrong reading that file. Try again.")
      setStatus("idle")
    }
  }

  const updateRow = (id, field, value) => {
    setTransactions(rows => rows.map(r => (r._id === id ? { ...r, [field]: value } : r)))
  }

  const removeRow = (id) => {
    setTransactions(rows => rows.filter(r => r._id !== id))
  }

  const confirm = async () => {
    setStatus("saving")
    for (const t of transactions) {
      await api("/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: t.description,
          amount: parseFloat(t.amount) || 0,
          category: t.category,
          date: t.date,
          type: t.type,
        }),
      })
    }
    setStatus("idle")
    setTransactions([])
    if (onAdded) onAdded()
  }

  const cancel = () => {
    setStatus("idle")
    setTransactions([])
    setError("")
    setTruncated(false)
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`

  if (status === "review") {
    const total = transactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Review scanned {docType === "statement" ? "statement" : "receipt"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{transactions.length} found · {fmt(total)}</p>
        </div>

        {truncated && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
            That PDF has more than 6 pages — only the first 6 were scanned.
          </p>
        )}

        {(() => {
          const bankCharges = transactions.filter(t => t.category === "Bank Charges")
          const bankChargesTotal = bankCharges.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
          if (bankCharges.length === 0) return null
          return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                🏦 Bank charges detected: {fmt(bankChargesTotal)} across {bankCharges.length} fee{bankCharges.length === 1 ? "" : "s"}
              </p>
            </div>
          )
        })()}

        {(() => {
          const bankCharges = transactions.filter(t => t.category === "Bank Charges")
          const bankChargesTotal = bankCharges.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
          if (bankCharges.length === 0) return null
          return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                🏦 Bank charges detected: {fmt(bankChargesTotal)} across {bankCharges.length} fee{bankCharges.length === 1 ? "" : "s"}
              </p>
            </div>
          )
        })()}

        {(() => {
          const bankCharges = transactions.filter(t => t.category === "Bank Charges")
          const bankChargesTotal = bankCharges.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
          if (bankCharges.length === 0) return null
          return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                🏦 Bank charges detected: {fmt(bankChargesTotal)} across {bankCharges.length} fee{bankCharges.length === 1 ? "" : "s"}
              </p>
            </div>
          )
        })()}

        {(() => {
          const bankCharges = transactions.filter(t => t.category === "Bank Charges")
          const bankChargesTotal = bankCharges.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
          if (bankCharges.length === 0) return null
          return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                🏦 Bank charges detected: {fmt(bankChargesTotal)} across {bankCharges.length} fee{bankCharges.length === 1 ? "" : "s"}
              </p>
            </div>
          )
        })()}

        {transactions.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Nothing left to add</p>
        )}

        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t._id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                  value={t.description}
                  onChange={e => updateRow(t._id, "description", e.target.value)}
                />
                <button onClick={() => removeRow(t._id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs px-1">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 px-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">R</span>
                  <input
                    className="flex-1 py-1.5 text-sm bg-transparent dark:text-gray-100 outline-none"
                    type="number"
                    value={t.amount}
                    onChange={e => updateRow(t._id, "amount", e.target.value)}
                  />
                </div>
                <input
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                  type="date"
                  value={t.date}
                  onChange={e => updateRow(t._id, "date", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                  value={t.category}
                  onChange={e => updateRow(t._id, "category", e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateRow(t._id, "type", "Need")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${t.type === "Need" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}
                  >Need</button>
                  <button
                    onClick={() => updateRow(t._id, "type", "Want")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${t.type === "Want" ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}
                  >Want</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={confirm}
            disabled={transactions.length === 0 || status === "saving"}
            className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {status === "saving" ? "Adding..." : `Add ${transactions.length} expense${transactions.length === 1 ? "" : "s"}`}
          </button>
          <button onClick={cancel} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={status === "scanning"}
        className="w-full border border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-60"
      >
        {status === "scanning" ? "Reading your file..." : "📷 Scan a receipt or statement (photo or PDF)"}
      </button>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}