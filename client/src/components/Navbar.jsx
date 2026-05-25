import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import ConfirmModal from './ConfirmModal'
import { toast } from 'react-hot-toast'
import { 
  LayoutGrid, 
  Flame, 
  Timer,
  Calendar,
  Menu, 
  X,
  LogOut, 
  User
} from 'lucide-react'

const Navbar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Logged out successfully')
  }

  const navItems = [
    { to: '/app/tasks',     icon: LayoutGrid, label: 'Tasks'    },
    { to: '/app/habits',    icon: Flame,      label: 'Habits'   },
    { to: '/app/pomodoro',  icon: Timer,      label: 'Pomodoro' },
    { to: '/app/calendar',  icon: Calendar,   label: 'Calendar' },
  ]

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all duration-200 ${
      isActive
        ? 'bg-[#1C1814] text-white shadow-md'
        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
    }`

  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* ── MOBILE TOP BAR (visible only on < md) ─────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-2 select-none">
          <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
            <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-5 w-5" />
          </div>
          <span className="text-base font-black text-gray-950 tracking-tighter">FlowSpace</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-all"
          aria-label="Toggle menu"
        >
          {mobileOpen
            ? <X className="h-5 w-5 text-gray-700" />
            : <Menu className="h-5 w-5 text-gray-700" />}
        </button>
      </header>

      {/* ── MOBILE OVERLAY DRAWER ──────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      {/* Drawer panel */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-full z-[70] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal={mobileOpen}
      >
        {/* Drawer header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-6 w-6" />
            <span className="text-lg font-black text-gray-950 tracking-tighter">FlowSpace</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {/* Drawer nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setMobileOpen(false)}>
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        {/* Drawer footer */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 font-medium truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => { setMobileOpen(false); setShowLogoutModal(true) }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </div>

      {/* ── DESKTOP COLLAPSIBLE SIDEBAR (hidden on mobile) ─────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Sidebar header */}
        <div className={`flex items-center h-16 px-3 gap-3 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 shrink-0"
            aria-label="Toggle sidebar"
          >
            {collapsed
              ? <Menu className="h-5 w-5 text-gray-600" />
              : <X className="h-5 w-5 text-gray-600" />}
          </button>
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 select-none ${
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 shrink-0">
              <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-6 w-6" />
            </div>
            <span className="text-lg font-black text-gray-950 tracking-tighter whitespace-nowrap">FlowSpace</span>
          </div>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-4 overflow-hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap overflow-hidden ${
                  isActive
                    ? 'bg-[#1C1814] text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={`transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-100 p-3 flex flex-col gap-2">
          <div className={`flex items-center gap-3 px-1 overflow-hidden ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className={`min-w-0 transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 font-medium truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all whitespace-nowrap overflow-hidden ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out of FlowSpace? Any unsaved changes might be lost."
        confirmText="Sign out"
      />
    </>
  )
}

export default Navbar
