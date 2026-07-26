import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import { toast } from 'react-hot-toast'
import { Moon, Sun } from 'lucide-react'

const LoginPage = () => {
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/app')
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-sm relative">
        <div className="glow" />

        <div className="fade-up text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/')}>
            <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-9 w-9" />
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">FlowSpace</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
        </div>

        <div className="fade-up-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                required placeholder="Enter your email" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.05 10.05 0 0 1 12 20c-5.52 0-10-4.48-10-10 0-1.09.18-2.14.52-3.12" />
                    <path d="M1 1l22 22" />
                    <path d="M4.19 4.19A9.97 9.97 0 0 1 12 2c5.52 0 10 4.48 10 10 0 1.47-.34 2.88-.95 4.13" />
                    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
            <button type="submit" disabled={loading} className="btn-dark w-full mt-2 border btn-gold-premium">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>

        <div className="fade-up-3 text-center mt-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-gray-900 dark:text-gray-100 font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
