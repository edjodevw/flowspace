import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import TasksPage from './pages/TasksPage'
import HabitsPage from './pages/HabitsPage'
import PomodoroPage from './pages/PomodoroPage'
import CalendarPage from './pages/CalendarPage'
import InsightsPage from './pages/InsightsPage'
import SettingsPage from './pages/SettingsPage'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'

const App = () => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden transition-colors duration-300">
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden pt-14 md:pt-0">
        <Routes>
          <Route path="/" element={<Navigate to="tasks" />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {user?.isAdmin && <Route path="admin" element={<AdminDashboard />} />}
        </Routes>
      </main>
    </div>
  )
}

export default App
