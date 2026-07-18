import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Check,
  Coffee,
  Eye,
  EyeOff,
  Shield,
  Timer,
  Trash2,
  User,
  Zap
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 }
]

const DEFAULT_MINUTES = { focus: 25, short: 5, long: 15 }
const MIN_MINUTES = 1
const MAX_MINUTES = 180

const storageKey = (userId) => `flowspace-pomodoro-${userId || 'guest'}`

const clampMinutes = (value, fallback) => {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return fallback
  return Math.min(Math.max(parsed, MIN_MINUTES), MAX_MINUTES)
}

const loadPomodoro = (userId) => {
  try {
    const saved = localStorage.getItem(storageKey(userId))
    if (saved) return JSON.parse(saved)
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_MINUTES }
}

const SettingsPage = () => {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [pomodoro, setPomodoro] = useState(() => loadPomodoro(user?.id))
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState('')

  // Sync profile fields whenever the auth user changes (e.g. after a successful save)
  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' })
    }
  }, [user?.name, user?.email])

  // Reload pomodoro from storage when the logged-in user changes
  useEffect(() => {
    setPomodoro(loadPomodoro(user?.id))
  }, [user?.id])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!profile.name.trim()) return toast.error('Name is required')
    if (!profile.email.trim()) return toast.error('Email is required')
    setSaving('profile')
    try {
      const res = await api.put('/auth/profile', {
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase()
      })
      const token = localStorage.getItem('token')
      if (token) login(token, res.data)
      // profile state will sync via the useEffect watching user?.name / user?.email
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update profile')
    } finally {
      setSaving('')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')

    setSaving('password')
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update password')
    } finally {
      setSaving('')
    }
  }

  const savePomodoro = () => {
    const next = {
      focus: clampMinutes(pomodoro.focus, DEFAULT_MINUTES.focus),
      short: clampMinutes(pomodoro.short, DEFAULT_MINUTES.short),
      long: clampMinutes(pomodoro.long, DEFAULT_MINUTES.long)
    }
    setPomodoro(next)
    localStorage.setItem(storageKey(user?.id), JSON.stringify(next))
    toast.success('Timer settings saved')
  }

  const deleteAccount = async (e) => {
    e.preventDefault()
    if (!confirmDelete) return toast.error('Confirm account deletion first')
    if (!deletePassword) return toast.error('Password is required')

    // Capture the userId BEFORE logout() clears the user, so storage keys are correct
    const currentUserId = user?.id
    setSaving('delete')
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } })
      localStorage.removeItem(storageKey(currentUserId))
      logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete account')
    } finally {
      setSaving('')
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#FAFAF8] p-4 sm:p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 max-w-5xl">
        <aside className="w-full md:w-56 shrink-0">
          <nav className="grid grid-cols-5 md:flex md:flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const danger = id === 'danger'
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  title={label}
                  className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 rounded-2xl text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all duration-200 w-full text-left ${
                    active
                      ? danger ? 'bg-red-500 text-white shadow-md' : 'bg-[#1C1814] text-white shadow-md'
                      : danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline truncate">{label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 min-h-[430px]">
          {activeTab === 'profile' && (
            <section>
              <SectionTitle title="Profile" text="Update the name and email shown across FlowSpace." />
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                <Field label="Full name">
                  <input className="input-field" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                </Field>
                <Field label="Email">
                  <input 
                    className="input-field opacity-70 cursor-not-allowed bg-gray-50" 
                    type="email" 
                    value={profile.email} 
                    readOnly 
                    title="Email cannot be changed"
                  />
                </Field>
                <button type="submit" disabled={saving === 'profile'} className="btn-dark !py-2.5 !text-xs">
                  <Check className="h-4 w-4 mr-2" />
                  {saving === 'profile' ? 'Saving...' : 'Save profile'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'security' && (
            <section>
              <SectionTitle title="Security" text="Change your password using your current password." />
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                {[
                  ['currentPassword', 'Current password'],
                  ['newPassword', 'New password'],
                  ['confirmPassword', 'Confirm new password']
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      className="input-field pr-12"
                      type={showPasswords ? 'text' : 'password'}
                      value={passwords[key]}
                      onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                      required
                    />
                  </Field>
                ))}
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="btn-outline !py-2 !px-4 !text-xs">
                  {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>
                <button type="submit" disabled={saving === 'password'} className="btn-dark !py-2.5 !text-xs ml-3">
                  {saving === 'password' ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'pomodoro' && (
            <section>
              <SectionTitle title="Pomodoro" text="Set the timer durations used on the Pomodoro page." />
              <div className="space-y-4 max-w-xl">
                {[
                  ['focus', 'Focus session', Zap],
                  ['short', 'Short break', Coffee],
                  ['long', 'Long break', Coffee]
                ].map(([key, label, Icon]) => (
                  <Field key={key} label={label} icon={Icon}>
                    <div className="flex items-center gap-3">
                      <input
                        className="input-field"
                        type="number"
                        min={MIN_MINUTES}
                        max={MAX_MINUTES}
                        value={pomodoro[key]}
                        onChange={e => setPomodoro({ ...pomodoro, [key]: e.target.value })}
                      />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">min</span>
                    </div>
                  </Field>
                ))}
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={savePomodoro} className="btn-dark !py-2.5 !text-xs">Save timer settings</button>
                  <button type="button" onClick={() => setPomodoro({ ...DEFAULT_MINUTES })} className="btn-outline !py-2.5 !text-xs">Defaults</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'danger' && (
            <section>
              <SectionTitle title="Danger Zone" text="Delete your account and all FlowSpace data permanently." />
              <form onSubmit={deleteAccount} className="space-y-4 max-w-xl">
                <label className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  <input type="checkbox" checked={confirmDelete} onChange={e => setConfirmDelete(e.target.checked)} className="mt-1" />
                  <span>I understand this will permanently delete my tasks, habits, calendar events, and Pomodoro history.</span>
                </label>
                <Field label="Confirm with password">
                  <input className="input-field" type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required />
                </Field>
                <button type="submit" disabled={saving === 'delete'} className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {saving === 'delete' ? 'Deleting...' : 'Delete account'}
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

const SectionTitle = ({ title, text }) => (
  <div className="mb-6">
    <h2 className="text-sm font-black text-gray-950 uppercase tracking-widest">{title}</h2>
    <p className="text-sm text-gray-400 mt-1">{text}</p>
  </div>
)

const Field = ({ label, icon: Icon, children }) => (
  <label className="block">
    <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
    {children}
  </label>
)

export default SettingsPage
