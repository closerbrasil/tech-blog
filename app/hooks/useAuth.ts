import { useState, useEffect } from 'react'

const ADMIN_USER = 'admin'
const ADMIN_PASSWORD = 'brasilCloser2025'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (username: string, password: string) => {
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    login,
    logout
  }
} 