//const BASE = "https://moneymap-5zkm.onrender.com"
const BASE = "http://127.0.0.1:8000"
export const getToken = () => localStorage.getItem("token")
export const getUser = () => JSON.parse(localStorage.getItem("user") || "null")
export const setAuth = (token, user) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}
export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const currentMonth = () => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export const getDarkMode = () => {
  const stored = localStorage.getItem("darkMode")
  if (stored !== null) return stored === "true"
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
}
export const setDarkModePref = (value) => {
  localStorage.setItem("darkMode", value)
}

export const api = async (path, options = {}) => {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    clearAuth()
    window.location.href = "/"
  }
  return res.json()
}