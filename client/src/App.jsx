import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import TasksPage from './pages/TasksPage'
import HabitsPage from './pages/HabitsPage'
import PomodoroPage from './pages/PomodoroPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './context/AuthContext'

const App = () => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden pt-14 md:pt-0">
        <Routes>
          <Route path="/" element={<Navigate to="tasks" />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
