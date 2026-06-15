const BASE = "https://moneymap-5zkm.onrender.com"

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