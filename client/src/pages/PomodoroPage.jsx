import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import {
  RotateCcw,
  Play,
  Pause,
  Brain,
  Zap,
  Coffee,
  History,
  Timer,
  Settings,
  X
} from 'lucide-react'

const DEFAULT_MINUTES = { focus: 25, short: 5, long: 15 }
const MIN_MINUTES = 1
const MAX_MINUTES = 180

const MODE_META = [
  { id: 'focus', label: 'Focus', icon: Brain },
  { id: 'short', label: 'Short break', icon: Coffee },
  { id: 'long', label: 'Long break', icon: Coffee }
]

const storageKey = (userId) => `flowspace-pomodoro-${userId || 'guest'}`

const loadDurations = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { ...DEFAULT_MINUTES }
    const parsed = JSON.parse(raw)
    return {
      focus: clampMinutes(parsed.focus, DEFAULT_MINUTES.focus),
      short: clampMinutes(parsed.short, DEFAULT_MINUTES.short),
      long: clampMinutes(parsed.long, DEFAULT_MINUTES.long)
    }
  } catch {
    return { ...DEFAULT_MINUTES }
  }
}

const saveDurations = (userId, durations) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(durations))
}

const clampMinutes = (value, fallback = 25) => {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, n))
}

const buildModes = (minutes) =>
  MODE_META.map(m => ({
    ...m,
    duration: minutes[m.id] * 60
  }))

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const PomodoroPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [modeIndex, setModeIndex] = useState(0)
  const [durations, setDurations] = useState(() => loadDurations(user?.id))
  const [timeLeft, setTimeLeft] = useState(() => loadDurations(user?.id).focus * 60)
  const [running, setRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState(durations)
  const intervalRef = useRef(null)
  const modeDurationRef = useRef(durations.focus * 60)

  const modes = useMemo(() => buildModes(durations), [durations])
  const mode = modes[modeIndex]
  const progress = mode.duration > 0 ? ((mode.duration - timeLeft) / mode.duration) * 100 : 0
  const ringColor = '#1C1814'

  useEffect(() => {
    const loaded = loadDurations(user?.id)
    setDurations(loaded)
    setDraft(loaded)
    setTimeLeft(loaded.focus * 60)
    setModeIndex(0)
    setRunning(false)
  }, [user?.id])

  useEffect(() => {
    modeDurationRef.current = mode.duration
  }, [mode.duration])

  const { data: sessions = [] } = useQuery({
    queryKey: ['pomodoro'],
    queryFn: () => api.get('/pomodoro').then(r => r.data)
  })

  const saveSession = useMutation({
    mutationFn: (data) => api.post('/pomodoro', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pomodoro'])
      toast.success('Session saved!')
    },
    onError: () => toast.error('Unable to save session')
  })

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            const completedMinutes = Math.floor(modeDurationRef.current / 60)
            const modeId = MODE_META[modeIndex]?.id
            saveSession.mutate({
              duration: completedMinutes,
              type: modeId === 'focus' ? 'focus' : 'break'
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, modeIndex, saveSession])

  const switchMode = (index) => {
    setModeIndex(index)
    setTimeLeft(modes[index].duration)
    setRunning(false)
  }

  const reset = () => {
    setTimeLeft(mode.duration)
    setRunning(false)
  }

  const openSettings = () => {
    setDraft({ ...durations })
    setShowSettings(true)
  }

  const applySettings = () => {
    const next = {
      focus: clampMinutes(draft.focus, DEFAULT_MINUTES.focus),
      short: clampMinutes(draft.short, DEFAULT_MINUTES.short),
      long: clampMinutes(draft.long, DEFAULT_MINUTES.long)
    }
    setDurations(next)
    setDraft(next)
    saveDurations(user?.id, next)
    const nextModes = buildModes(next)
    if (!running) {
      setTimeLeft(nextModes[modeIndex].duration)
    }
    setShowSettings(false)
    toast.success('Timer durations updated')
  }

  const resetToDefaults = () => {
    setDraft({ ...DEFAULT_MINUTES })
  }

  const todaySessions = sessions.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
  const todayFocusMinutes = todaySessions.filter(s => s.type === 'focus').reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden">
      <div className="glass border-x-0 border-t-0 border-b border-white/40 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Pomodoro</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Focus {durations.focus}m · Short {durations.short}m · Long {durations.long}m
          </p>
        </div>
        <button
          type="button"
          onClick={openSettings}
          className="btn-outline !py-2.5 !px-5 flex items-center justify-center gap-2 !text-xs !rounded-xl shrink-0 w-full sm:w-auto"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Timer settings</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/30 p-4 sm:p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { value: todaySessions.length, label: 'Sessions today', icon: Timer },
              { value: `${todayFocusMinutes}m`, label: 'Focus time', icon: Zap },
              { value: todaySessions.filter(s => s.type === 'focus').length, label: 'Pomodoros', icon: Brain }
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center shadow-sm animate-in fade-in duration-700">
                  <div className="flex justify-center mb-1">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-xl font-black text-gray-950 tracking-tighter">{s.value}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              )
            })}
          </div>

          <div className="timer-card bg-white border border-white rounded-3xl sm:rounded-[40px] p-5 sm:p-8 lg:p-12 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex gap-2 bg-gray-50/50 backdrop-blur-sm rounded-2xl p-1 mb-10 border border-gray-100/50 max-w-sm mx-auto">
              {modes.map((m, i) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => switchMode(i)}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-all duration-300 ${modeIndex === i ? 'bg-[#1C1814] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{m.label}</span>
                    <span className="sm:hidden text-[8px] opacity-80">{Math.floor(m.duration / 60)}m</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-center mb-10">
              <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#F1F1F1" strokeWidth="5" />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (progress * 2.83)}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                    className="drop-shadow-[0_0_8px_rgba(28,24,20,0.2)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl lg:text-5xl font-black text-gray-950 tracking-tighter tabular-nums leading-none">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                    {mode.label}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
                    of {Math.floor(mode.duration / 60)} min
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={reset}
                className="btn-outline !py-2.5 !px-6 !text-xs !rounded-xl flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setRunning(!running)}
                className={`w-full sm:w-auto sm:min-w-[150px] !py-3 !px-8 !text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 ${running ? 'bg-[#1C1814] text-white font-bold' : 'btn-gold-premium'}`}
              >
                {running ? (
                  <>
                    <Pause className="h-4 w-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>{timeLeft === mode.duration ? 'Start' : 'Resume'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-950" />
                  <h2 className="font-bold text-gray-950 text-xs uppercase tracking-widest px-1">Recent Flow</h2>
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">History</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessions.slice(0, 6).map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-white hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg shadow-sm ${session.type === 'focus' ? 'bg-[#1C1814] text-white' : 'bg-gray-200 text-gray-900'}`}>
                        {session.type === 'focus' ? <Brain className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 capitalize">{session.type}</span>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-950">{session.duration}m</span>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-gray-950 uppercase tracking-widest">Timer settings</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Set how long each session runs. Changes apply when the timer is paused or reset.
            </p>

            <div className="space-y-4">
              {[
                { key: 'focus', label: 'Focus session', icon: Brain },
                { key: 'short', label: 'Short break', icon: Coffee },
                { key: 'long', label: 'Long break', icon: Coffee }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={MIN_MINUTES}
                      max={MAX_MINUTES}
                      value={draft[key]}
                      onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                      className="input-field !bg-gray-50/80 flex-1"
                    />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">min</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={applySettings} className="btn-dark flex-1 !py-2.5 !text-xs !rounded-xl">
                Save
              </button>
              <button type="button" onClick={resetToDefaults} className="btn-outline !py-2.5 !px-4 !text-xs !rounded-xl">
                Defaults
              </button>
              <button type="button" onClick={() => setShowSettings(false)} className="btn-outline !py-2.5 !px-4 !text-xs !rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PomodoroPage
