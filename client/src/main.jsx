import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import App from './App'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import './index.css'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/app" />
}

const ThemedToaster = () => {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 3000,
        style: isDark
          ? { background: '#171717', color: '#FAFAFA', border: '1px solid #262626' }
          : { background: '#1C1814', color: '#FDFBF7' },
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedToaster />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/app/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
)
