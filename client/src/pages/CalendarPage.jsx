import { useState, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import ConfirmModal from '../components/ConfirmModal'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Trash2,
  Pencil
} from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const EVENT_COLORS = ['#1C1814', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB']

const toDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const buildCalendarDays = (viewDate) => {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const days = []

  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), currentMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true })
  }
  const last = days[days.length - 1].date
  let next = new Date(last)
  next.setDate(next.getDate() + 1)
  while (days.length < 42) {
    days.push({ date: new Date(next), currentMonth: false })
    next.setDate(next.getDate() + 1)
  }
  return days
}

const eventMatchesDay = (event, dateKey) => {
  const startKey = toDateKey(new Date(event.startAt))
  const endKey = event.endAt ? toDateKey(new Date(event.endAt)) : startKey
  return dateKey >= startKey && dateKey <= endKey
}

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const emptyForm = (dateKey) => ({
  title: '',
  description: '',
  date: dateKey,
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  color: EVENT_COLORS[0]
})

const CalendarPage = () => {
  const queryClient = useQueryClient()
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [form, setForm] = useState(emptyForm(toDateKey(today)))
  const [eventToDelete, setEventToDelete] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', year, month],
    queryFn: () => api.get('/events', { params: { year, month } }).then(r => r.data)
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events'] })

  const createEvent = useMutation({
    mutationFn: (data) => api.post('/events', data),
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setEditingEvent(null)
      toast.success('Event scheduled')
    },
    onError: () => toast.error('Unable to create event')
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/events/${id}`, data),
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setEditingEvent(null)
      toast.success('Event updated')
    },
    onError: () => toast.error('Unable to update event')
  })

  const deleteEvent = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}`),
    onSuccess: () => {
      invalidate()
      setEventToDelete(null)
      toast.success('Event deleted')
    },
    onError: () => toast.error('Unable to delete event')
  })

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const eventsByDay = useMemo(() => {
    const map = {}
    events.forEach(event => {
      calendarDays.forEach(({ date }) => {
        const key = toDateKey(date)
        if (eventMatchesDay(event, key)) {
          if (!map[key]) map[key] = []
          if (!map[key].some(e => e.id === event.id)) map[key].push(event)
        }
      })
    })
    return map
  }, [events, calendarDays])

  const selectedEvents = (eventsByDay[selectedDate] || [])
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))

  const goToMonth = (offset) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const goToToday = () => {
    const now = new Date()
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(toDateKey(now))
  }

  const selectDay = (date, currentMonth) => {
    const key = toDateKey(date)
    setSelectedDate(key)
    if (!currentMonth) {
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  const openCreateForm = () => {
    setEditingEvent(null)
    setForm(emptyForm(selectedDate))
    setShowForm(true)
  }

  const openEditForm = (event) => {
    const start = new Date(event.startAt)
    const end = event.endAt ? new Date(event.endAt) : null
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description || '',
      date: toDateKey(start),
      startTime: event.allDay ? '09:00' : `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      endTime: end && !event.allDay
        ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
        : '10:00',
      allDay: event.allDay,
      color: event.color || EVENT_COLORS[0]
    })
    setShowForm(true)
  }

  const buildPayload = () => {
    const { title, description, date, startTime, endTime, allDay, color } = form
    if (!title.trim()) {
      toast.error('Please enter an event title')
      return null
    }
    if (allDay) {
      const startAt = new Date(`${date}T00:00:00`)
      const endAt = new Date(`${date}T23:59:59`)
      return { title, description, startAt, endAt, allDay: true, color }
    }
    const startAt = new Date(`${date}T${startTime}:00`)
    const endAt = new Date(`${date}T${endTime}:00`)
    if (endAt <= startAt) {
      toast.error('End time must be after start time')
      return null
    }
    return { title, description, startAt, endAt, allDay: false, color }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = buildPayload()
    if (!payload) return
    if (editingEvent) updateEvent.mutate({ id: editingEvent.id, ...payload })
    else createEvent.mutate(payload)
  }

  const todayKey = toDateKey(today)

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 w-full p-4 sm:p-8 bg-gray-50/30">
        <div className="h-8 w-40 rounded-full bg-gray-200/50 animate-pulse mb-6" />
        <div className="h-80 rounded-3xl bg-gray-200/30 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full">
      <div className="glass border-x-0 border-t-0 border-b border-white/40 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Calendar</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {events.length} event{events.length !== 1 ? 's' : ''} this month
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="btn-gold-premium !py-2.5 !px-5 flex items-center justify-center gap-2 !text-xs !rounded-xl shrink-0 w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Schedule event</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Month grid */}
          <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                  <CalendarIcon className="h-4 w-4 text-gray-900" />
                </div>
                <h2 className="text-sm font-black text-gray-950 uppercase tracking-widest">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToMonth(-1)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => goToMonth(1)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, currentMonth }) => {
                const key = toDateKey(date)
                const isSelected = key === selectedDate
                const isToday = key === todayKey
                const dayEvents = eventsByDay[key] || []

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(date, currentMonth)}
                    className={`min-h-[52px] sm:min-h-[64px] p-1.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-[#1C1814] border-[#1C1814] text-white shadow-md'
                        : isToday
                          ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
                          : currentMonth
                            ? 'bg-white border-gray-100 hover:border-amber-200 hover:bg-amber-50/30'
                            : 'bg-gray-50/50 border-transparent text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-xs font-bold block mb-1 ${
                      isSelected ? 'text-white' : isToday ? 'text-gray-900' : currentMonth ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {date.getDate()}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? '#fff' : ev.color }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className={`text-[8px] font-bold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day panel */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-950 uppercase tracking-widest mb-1">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString([], {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
              </p>

              {selectedEvents.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">No events</p>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900"
                  >
                    + Add event
                  </button>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[320px] overflow-y-auto">
                  {selectedEvents.map(event => (
                    <li
                      key={event.id}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-amber-100 hover:bg-amber-50/20 transition-all"
                    >
                      <span
                        className="w-1 self-stretch rounded-full shrink-0 min-h-[2rem]"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.allDay
                            ? 'All day'
                            : `${formatTime(event.startAt)}${event.endAt ? ` – ${formatTime(event.endAt)}` : ''}`}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditForm(event)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventToDelete(event)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-gray-950 uppercase tracking-widest">
                {editingEvent ? 'Edit event' : 'Schedule event'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingEvent(null) }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Title</label>
                <input
                  type="text"
                  placeholder="Meeting, deadline, reminder..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-field !bg-gray-50/80"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="input-field !bg-gray-50/80"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={e => setForm({ ...form, allDay: e.target.checked })}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">All day</span>
              </label>

              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Start</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      className="input-field !bg-gray-50/80"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">End</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm({ ...form, endTime: e.target.value })}
                      className="input-field !bg-gray-50/80"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Color</label>
                <div className="flex gap-2 px-1">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Notes</label>
                <textarea
                  placeholder="Optional details..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="input-field !bg-gray-50/80 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createEvent.isPending || updateEvent.isPending}
                  className="btn-dark flex-1 !py-2.5 !text-xs !rounded-xl"
                >
                  {createEvent.isPending || updateEvent.isPending
                    ? 'Saving...'
                    : editingEvent ? 'Update' : 'Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingEvent(null) }}
                  className="btn-outline !py-2.5 !px-6 !text-xs !rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => deleteEvent.mutate(eventToDelete.id)}
        title="Delete event"
        message={`Remove "${eventToDelete?.title}" from your calendar?`}
        confirmText="Delete"
      />
    </div>
  )
}

export default CalendarPage
