/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('thaivu_token'))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('thaivu_token')))

  const logout = useCallback(() => {
    localStorage.removeItem('thaivu_token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    let cancel = false
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await api.get('/api/me')
        if (!cancel) setUser(data)
      } catch {
        if (!cancel) logout()
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [token, logout])

  const loginWithToken = useCallback((t, u) => {
    localStorage.setItem('thaivu_token', t)
    setToken(t)
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      loginWithToken,
      logout,
      isAdmin: user?.role === 'admin',
    }),
    [user, token, loading, loginWithToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
