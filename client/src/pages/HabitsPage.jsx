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
  X
} from 'lucide-react'

const getStreak = (logs) => {
  if (!logs || logs.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let current = new Date(today)
  while (true) {
    const found = logs.some(log => {
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
  return logs.some(log => {
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
  const logHabit = useMutation({
    mutationFn: (id) => api.post(`/habits/${id}/log`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits'])
      toast.success('Habit logged for today')
    },
    onError: () => toast.error('Unable to log habit')
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

  const completedToday = habits.filter(h => isLoggedToday(h.logs)).length

  if (isLoading) return (
    <div className="flex-1 w-full p-8 bg-gray-50/30">
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-full bg-gray-200/50 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-gray-200/50 animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-gray-200/30 animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-200/30 animate-pulse" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden">
      <div className="glass border-x-0 border-t-0 border-b border-white/40 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Habits</h1>
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

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 bg-gray-50/30">
        <div className="max-w-7xl mx-auto space-y-8">
          {habits.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 lg:p-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Today's Progress</span>
                </div>
                <span className="text-lg font-black text-gray-950">{Math.round(habits.length ? (completedToday / habits.length) * 100 : 0)}%</span>
              </div>
              <div className="w-full bg-gray-100/50 rounded-full h-2.5 overflow-hidden border border-gray-100/50">
                <div className="h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(200,153,90,0.3)]"
                  style={{ width: `${habits.length ? (completedToday / habits.length) * 100 : 0}%`, background: '#1C1814' }} />
              </div>
              {completedToday === habits.length && habits.length > 0 && (
                <p className="text-xs text-gray-900 font-bold mt-4 flex items-center gap-2 animate-bounce">
                  <Sparkles className="h-3.5 w-3.5" /> Perfect day! All habits crushed.
                </p>
              )}
            </div>
          )}

          {showForm && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <h2 className="font-bold text-gray-950 mb-4 text-xs uppercase tracking-widest px-1">New Habit</h2>
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
            <div className="flex flex-col items-center justify-center text-center rounded-[32px] border-2 border-dashed border-gray-200 bg-white p-12 lg:p-20 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-4xl mb-6 text-gray-900 border border-gray-100">
                <Leaf className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-950 mb-2">No habits tracked yet</h2>
              <p className="text-gray-500 max-w-sm mb-8 font-medium">Small daily actions lead to big results. Start your journey by adding your first habit.</p>
              <button className="btn-gold-premium !px-8 !py-3 !rounded-xl" onClick={() => setShowForm(true)}>Add your first habit</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {habits.map(habit => {
                const done = isLoggedToday(habit.logs)
                const streak = getStreak(habit.logs)
                return (
                  <div key={habit.id}
                    className={`transition-all duration-300 group border rounded-3xl p-5 lg:p-6 flex items-center gap-5 animate-in fade-in slide-in-from-bottom-2 ${done ? 'bg-gray-50/40 border-gray-200/50 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
                    <button 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${done ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-white border-gray-100 text-transparent hover:border-gray-300'}`} 
                      onClick={() => toggleHabit(habit)}
                    >
                      <Check className={`h-5 w-5 ${done ? 'scale-100 rotate-0' : 'scale-0 -rotate-45'} transition-all duration-500`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-md font-bold truncate ${done ? 'text-gray-900 line-through opacity-70' : 'text-gray-950'}`}>{habit.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          <Flame className="h-3 w-3 text-gray-900" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
    </div>
  )
}

export default HabitsPage
