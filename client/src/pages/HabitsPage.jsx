import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import ConfirmModal from '../components/ConfirmModal'
import { 
  Plus, 
  Trash2, 
  Check, 
  Flame, 
  Sparkles, 
  Leaf, 
  History,
  X,
  Pencil
} from 'lucide-react'

const getStreak = (logs) => {
  if (!logs || logs.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let current = new Date(today)
  while (true) {
    const found = logs.some(log => {
      if (log.day) {
        const [y, m, d] = log.day.split('-').map(Number)
        const ld = new Date(y, m - 1, d)
        ld.setHours(0, 0, 0, 0)
        return ld.getTime() === current.getTime()
      }
      const d = new Date(log.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === current.getTime()
    })
    if (!found) break
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

const isLoggedToday = (logs) => {
  if (!logs || logs.length === 0) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return logs.some(log => {
    if (log.day) return log.day === todayKey
    const d = new Date(log.date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })
}

const HabitsPage = () => {
  const queryClient = useQueryClient()
  const [newHabit, setNewHabit] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState(null)
  const [editingHabit, setEditingHabit] = useState(null)
  const [editName, setEditName] = useState('')

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(r => r.data)
  })

  const createHabit = useMutation({
    mutationFn: (name) => api.post('/habits', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      setNewHabit('')
      setShowForm(false)
      toast.success('Habit created')
    },
    onError: () => toast.error('Unable to create habit')
  })
  const renameHabit = useMutation({
    mutationFn: ({ id, name }) => api.put(`/habits/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      setEditingHabit(null)
      setEditName('')
      toast.success('Habit renamed')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Unable to rename habit')
  })
  const logHabit = useMutation({
    mutationFn: (id) => api.post(`/habits/${id}/log`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      toast.success('Habit logged for today')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Unable to log habit')
  })
  const unlogHabit = useMutation({
    mutationFn: (id) => api.delete(`/habits/${id}/log`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      toast.success('Habit unlogged')
    },
    onError: () => toast.error('Unable to unlog habit')
  })
  const deleteHabit = useMutation({
    mutationFn: (id) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      setHabitToDelete(null)
      toast.success('Habit deleted')
    },
    onError: () => toast.error('Unable to delete habit')
  })

  const toggleHabit = (habit) => {
    if (isLoggedToday(habit.logs)) unlogHabit.mutate(habit.id)
    else logHabit.mutate(habit.id)
  }

  const startEdit = (habit) => {
    setEditingHabit(habit)
    setEditName(habit.name)
  }

  const saveEdit = () => {
    const name = editName.trim()
    if (!name) return toast.error('Habit name is required')
    if (!editingHabit) return
    renameHabit.mutate({ id: editingHabit.id, name })
  }

  const completedToday = habits.filter(h => isLoggedToday(h.logs)).length

  if (isLoading) return (
    <div className="flex-1 w-full p-8 bg-gray-50/30 dark:bg-gray-900/30">
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-full bg-gray-200/50 dark:bg-gray-800/50 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-gray-200/50 dark:bg-gray-800/50 animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-gray-200/30 dark:bg-gray-800/30 animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-200/30 dark:bg-gray-800/30 animate-pulse" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden">
      <div className="glass border-x-0 border-t-0 border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">Habits</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{completedToday} of {habits.length} completed today</p>
        </div>
        <button 
          className="btn-gold-premium !py-2.5 !px-5 flex items-center justify-center gap-2 !text-xs !rounded-xl shrink-0 w-full sm:w-auto" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{showForm ? 'Cancel' : 'Add habit'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 bg-gray-50/30 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto space-y-8">
          {habits.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 lg:p-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Today's Progress</span>
                </div>
                <span className="text-lg font-black text-gray-950 dark:text-gray-100">{Math.round(habits.length ? (completedToday / habits.length) * 100 : 0)}%</span>
              </div>
              <div className="w-full bg-gray-100/50 dark:bg-gray-800/50 rounded-full h-2.5 overflow-hidden border border-gray-100/50 dark:border-gray-800/50">
                <div className="h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(200,153,90,0.3)] bg-[#1C1814] dark:bg-amber-500"
                  style={{ width: `${habits.length ? (completedToday / habits.length) * 100 : 0}%` }} />
              </div>
              {completedToday === habits.length && habits.length > 0 && (
                <p className="text-xs text-gray-900 dark:text-gray-100 font-bold mt-4 flex items-center gap-2 animate-bounce">
                  <Sparkles className="h-3.5 w-3.5" /> Perfect day! All habits crushed.
                </p>
              )}
            </div>
          )}

          {showForm && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 lg:p-8 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <h2 className="font-bold text-gray-950 dark:text-gray-100 mb-4 text-xs uppercase tracking-widest px-1">New Habit</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="e.g. Exercise, Read 30 mins, Drink water..."
                  value={newHabit} onChange={e => setNewHabit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newHabit.trim() && createHabit.mutate(newHabit.trim())}
                  className="input-field flex-1 !bg-gray-50/50" />
                <div className="flex gap-2">
                  <button onClick={() => newHabit.trim() && createHabit.mutate(newHabit.trim())}
                    disabled={createHabit.isPending} className="btn-dark !py-2.5 !px-6 !text-xs !rounded-xl">Add</button>
                  <button onClick={() => setShowForm(false)} className="btn-outline !py-2.5 !px-6 !text-xs !rounded-xl">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 lg:p-20 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-4xl mb-6 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <Leaf className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-gray-100 mb-2">No habits tracked yet</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 font-medium">Small daily actions lead to big results. Start your journey by adding your first habit.</p>
              <button className="btn-gold-premium !px-8 !py-3 !rounded-xl" onClick={() => setShowForm(true)}>Add your first habit</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {habits.map(habit => {
                const done = isLoggedToday(habit.logs)
                const streak = getStreak(habit.logs)
                return (
                  <div key={habit.id}
                    className={`transition-all duration-300 group border rounded-3xl p-5 lg:p-6 flex items-center gap-5 animate-in fade-in slide-in-from-bottom-2 ${done ? 'bg-gray-50/40 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50 shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'}`}>
                    <button 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${done ? 'bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-950 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-transparent hover:border-gray-300 dark:hover:border-gray-600'}`} 
                      onClick={() => toggleHabit(habit)}
                    >
                      <Check className={`h-5 w-5 ${done ? 'scale-100 rotate-0' : 'scale-0 -rotate-45'} transition-all duration-500`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-md font-bold truncate ${done ? 'text-gray-900 dark:text-gray-300 line-through opacity-70' : 'text-gray-950 dark:text-gray-100'}`}>{habit.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                          <Flame className="h-3 w-3 text-gray-900 dark:text-gray-100" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(habit)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Rename habit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setHabitToDelete(habit)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={() => deleteHabit.mutate(habitToDelete.id)}
        title="Delete habit"
        message={`Are you sure you want to delete "${habitToDelete?.name}"? You will lose all your streak data.`}
        confirmText="Delete"
      />

      {editingHabit && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Rename habit</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="input-field w-full mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditingHabit(null); setEditName('') }}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={renameHabit.isPending}
                className="flex-1 btn-dark py-2 rounded-xl text-sm font-medium"
              >
                {renameHabit.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitsPage
