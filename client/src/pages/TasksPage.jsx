import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import { 
  ClipboardList, 
  Zap, 
  Sparkles, 
  Calendar, 
  Trash2, 
  Plus,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  X,
  Check,
  ListChecks
} from 'lucide-react'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6B7280', icon: ClipboardList },
  { id: 'inprogress', label: 'In Progress', color: '#1C1814', icon: Zap },
  { id: 'done', label: 'Completed', color: '#1C1814', icon: Sparkles }
]
const PRIORITIES = ['low', 'medium', 'high']
const DEFAULT_TAGS = ['Design', 'Dev', 'Content', 'Setup', 'Other']

const tagsStorageKey = (userId) => `flowspace-task-tags-${userId || 'guest'}`

const loadTags = (userId) => {
  try {
    const raw = localStorage.getItem(tagsStorageKey(userId))
    if (!raw) return [...DEFAULT_TAGS]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TAGS]
  } catch {
    return [...DEFAULT_TAGS]
  }
}

const saveTags = (userId, tags) => {
  localStorage.setItem(tagsStorageKey(userId), JSON.stringify(tags))
}

const priorityColor = {
  low: 'bg-gray-100/50 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  medium: 'bg-gray-100/50 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  high: 'bg-gray-100/50 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
}
const tagColor = {
  Design: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  Dev: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  Content: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  Setup: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  Other: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
}
const emptyForm = { title: '', priority: 'medium', tag: '', dueDate: '' }

const parseSubtasks = (subtasks) => {
  if (!subtasks) return []
  if (Array.isArray(subtasks)) return subtasks
  return []
}

const TasksPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [availableTags, setAvailableTags] = useState(() => loadTags(user?.id))
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({ title: '' })
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [tagToRemove, setTagToRemove] = useState(null)
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null)
  const [subtaskDraft, setSubtaskDraft] = useState('')
  const [dragOverCol, setDragOverCol] = useState(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data)
  })

  useEffect(() => {
    let cancelled = false
    const hydrateTags = async () => {
      try {
        const { data } = await api.get('/auth/settings')
        if (cancelled) return
        if (Array.isArray(data?.tags) && data.tags.length > 0) {
          setAvailableTags(data.tags)
          saveTags(user?.id, data.tags)
        } else {
          const local = loadTags(user?.id)
          setAvailableTags(local)
          if (local.length) {
            await api.put('/auth/settings', { tags: local })
          }
        }
      } catch {
        if (!cancelled) setAvailableTags(loadTags(user?.id))
      } finally {
        if (!cancelled) setSettingsLoaded(true)
      }
    }
    hydrateTags()
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    if (!tasks.length || !settingsLoaded) return
    setAvailableTags(prev => {
      const fromTasks = tasks.map(t => t.tag).filter(Boolean)
      const merged = [...new Set([...prev, ...fromTasks])]
      if (merged.length !== prev.length) {
        saveTags(user?.id, merged)
        api.put('/auth/settings', { tags: merged }).catch(() => {})
        return merged
      }
      return prev
    })
  }, [tasks, user?.id, settingsLoaded])

  const createTask = useMutation({
    mutationFn: (data) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setForm(emptyForm)
      setShowForm(false)
      setErrors({ title: '' })
      toast.success('Task added successfully')
    },
    onError: () => toast.error('Unable to add task')
  })
  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task updated')
    },
    onError: () => toast.error('Unable to update task')
  })
  const updateSubtasks = useMutation({
    mutationFn: ({ id, subtasks }) => api.put(`/tasks/${id}`, { subtasks }),
    onSuccess: () => queryClient.invalidateQueries(['tasks']),
    onError: () => toast.error('Unable to update subtasks')
  })
  const deleteTask = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task deleted permanentely')
    },
    onError: () => toast.error('Unable to delete task')
  })

  const validateTaskForm = () => {
    const nextErrors = { title: '' }
    if (!form.title.trim()) nextErrors.title = 'Please enter a task title.'
    setErrors(nextErrors)
    return !nextErrors.title
  }

  const handleCreateTask = () => {
    if (!validateTaskForm()) return
    createTask.mutate({ ...form, status: 'todo' })
  }

  const getColumnTasks = (status) => tasks.filter(t => t.status === status)
  const moveTask = (task, newStatus) =>
    updateTask.mutate(
      { id: task.id, status: newStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['tasks'])
          queryClient.invalidateQueries(['insights-summary'])
        }
      }
    )

  const saveSubtasks = (task, subtasks) => {
    updateSubtasks.mutate({ id: task.id, subtasks })
  }

  const toggleSubtask = (task, subtaskId) => {
    const subtasks = parseSubtasks(task.subtasks).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    saveSubtasks(task, subtasks)
  }

  const addSubtask = (task) => {
    const title = subtaskDraft.trim()
    if (!title) return
    const subtasks = [
      ...parseSubtasks(task.subtasks),
      { id: crypto.randomUUID(), title, completed: false }
    ]
    saveSubtasks(task, subtasks)
    setSubtaskDraft('')
    setAddingSubtaskFor(null)
  }

  const removeSubtask = (task, subtaskId) => {
    const subtasks = parseSubtasks(task.subtasks).filter(s => s.id !== subtaskId)
    saveSubtasks(task, subtasks)
  }

  const persistTags = (tags) => {
    setAvailableTags(tags)
    saveTags(user?.id, tags)
    api.put('/auth/settings', { tags }).catch(() => {})
  }

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', String(taskId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, colId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDragLeave = (colId) => {
    setDragOverCol((prev) => (prev === colId ? null : prev))
  }

  const handleDrop = (e, colId) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (Number.isNaN(taskId)) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === colId) return
    moveTask(task, colId)
  }

  const handleAddTag = (e) => {
    e?.preventDefault()
    const name = newTag.trim()
    if (!name) {
      toast.error('Category is required')
      return
    }
    if (availableTags.some(t => t.toLowerCase() === name.toLowerCase())) {
      toast.error('Category already exists')
      return
    }
    persistTags([...availableTags, name])
    setNewTag('')
    toast.success('Category added')
  }

  const handleRemoveTag = (tag) => {
    const count = tasks.filter(t => t.tag === tag).length
    if (count > 0) {
      setTagToRemove({ tag, count })
      return
    }
    finalizeRemoveTag(tag)
  }

  const finalizeRemoveTag = async (tag) => {
    persistTags(availableTags.filter(t => t !== tag))
    if (form.tag === tag) setForm(f => ({ ...f, tag: '' }))
    setTagToRemove(null)
    toast.success('Category removed')
  }

  const confirmRemoveTag = async () => {
    const { tag } = tagToRemove
    const affected = tasks.filter(t => t.tag === tag)
    try {
      await Promise.all(
        affected.map(t => api.put(`/tasks/${t.id}`, { tag: '' }))
      )
      queryClient.invalidateQueries(['tasks'])
      persistTags(availableTags.filter(t => t !== tag))
      if (form.tag === tag) setForm(f => ({ ...f, tag: '' }))
      setTagToRemove(null)
      toast.success('Category removed from all tasks')
    } catch {
      toast.error('Unable to remove category')
    }
  }

  if (isLoading) return (
    <div className="flex-1 min-h-0 w-full bg-white/50 dark:bg-gray-950 p-4 sm:p-8 transition-colors duration-300">
      <div className="space-y-8 h-full">
        <div className="h-10 w-44 rounded-full bg-gray-200/50 dark:bg-gray-800/50 animate-pulse" />
        <div className="grid grid-cols-3 gap-4 h-full">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4 h-full">
              <div className="h-12 rounded-2xl bg-gray-200/30 dark:bg-gray-800/30 animate-pulse" />
              <div className="h-full rounded-3xl bg-gray-200/20 dark:bg-gray-800/20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="glass border-x-0 border-t-0 border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">Tasks</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span><span className="text-gray-950 dark:text-gray-200">{tasks.filter(t => t.status !== 'done').length}</span> active tasks</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-gray-900 dark:text-gray-300">{getColumnTasks('done').length} completed</span>
          </p>
        </div>
        <button 
          type="button"
          className={`transition-all duration-300 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto ${showForm ? 'btn-outline' : 'btn-gold-premium'} !py-2.5 !px-5 !text-xs !rounded-xl`} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 md:p-6 shrink-0 overflow-y-auto max-h-[70vh] md:max-h-none shadow-sm">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-bold text-gray-950 dark:text-gray-100 mb-4 text-xs uppercase tracking-widest">Create New Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTask() }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Title</label>
                <input
                  type="text"
                  placeholder="What needs to be accomplished?"
                  value={form.title}
                  onChange={e => {
                    setForm({ ...form, title: e.target.value })
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }))
                  }}
                  className="input-field !bg-gray-50/80 dark:!bg-gray-800/80"
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-2 font-bold px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Priority</label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      className="input-field !bg-gray-50/80 dark:!bg-gray-800/80 appearance-none pr-10"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Category</label>
                  <div className="relative">
                    <select
                      value={form.tag}
                      onChange={e => setForm({ ...form, tag: e.target.value })}
                      className="input-field !bg-gray-50/80 dark:!bg-gray-800/80 appearance-none pr-10"
                    >
                      <option value="">No tag</option>
                      {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 p-2.5 space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Add category..."
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                        className="input-field !bg-white dark:!bg-gray-900 !py-2 !text-xs flex-1 min-w-0"
                        maxLength={32}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="btn-dark !py-2 !px-3 !text-[10px] !rounded-lg shrink-0 uppercase tracking-widest font-bold"
                      >
                        Add
                      </button>
                    </div>
                    {availableTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {availableTags.map(tag => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold border ${tagColor[tag] || 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
                              aria-label={`Remove ${tag}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Deadline</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="input-field !bg-gray-50/80 dark:!bg-gray-800/80"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="btn-dark !py-2.5 !px-8 !text-xs !rounded-xl"
                >
                  {createTask.isPending ? 'Processing...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-outline !py-2.5 !px-6 !text-xs !rounded-xl"
                >
                  Dismiss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-50/30 dark:bg-gray-900/30">
        <div className="flex flex-col md:flex-row md:h-full p-4 md:p-6 gap-6 md:gap-6">
          {COLUMNS.map(col => {
            const Icon = col.icon
            return (
              <div key={col.id} className="flex flex-col w-full md:flex-1 md:min-w-0 md:min-h-0 shrink-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                      <Icon className="h-4 w-4" style={{ color: col.color }} />
                    </div>
                    <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">{col.label}</h2>
                  </div>
                  <span className="text-[10px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 px-2 py-0.5 rounded-md font-bold shadow-sm">
                    {getColumnTasks(col.id).length}
                  </span>
                </div>
                
                <div
                  className={`space-y-3 flex-1 md:overflow-y-auto p-1.5 rounded-2xl min-h-[120px] transition-colors ${
                    dragOverCol === col.id ? 'bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-200/80 dark:ring-amber-800/50' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => handleDragLeave(col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  {getColumnTasks(col.id).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="task-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className={`text-sm font-bold leading-tight ${task.status === 'done' ? 'line-through text-gray-400 opacity-60' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </p>
                        <button onClick={() => setTaskToDelete(task)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold border ${priorityColor[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.tag && (
                          <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold border ${tagColor[task.tag] || 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>
                            {task.tag}
                          </span>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 ml-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-3 space-y-1.5">
                        {(() => {
                          const subtasks = parseSubtasks(task.subtasks)
                          const doneCount = subtasks.filter(s => s.completed).length
                          return (
                            <>
                              {subtasks.length > 0 && (
                                <div className="flex items-center justify-between px-0.5 mb-1">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <ListChecks className="h-3 w-3" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Subtasks</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400">
                                    {doneCount}/{subtasks.length}
                                  </span>
                                </div>
                              )}
                              {subtasks.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2 group/sub">
                                  <button
                                    type="button"
                                    onClick={() => toggleSubtask(task, sub.id)}
                                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      sub.completed
                                        ? 'bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 bg-white dark:bg-gray-800'
                                    }`}
                                  >
                                    {sub.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                  </button>
                                  <span className={`flex-1 text-xs leading-tight ${
                                    sub.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {sub.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeSubtask(task, sub.id)}
                                    className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 p-0.5 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              {task.status === 'todo' && (
                                addingSubtaskFor === task.id ? (
                                  <form
                                    className="flex items-center gap-1.5 pt-0.5"
                                    onSubmit={(e) => { e.preventDefault(); addSubtask(task) }}
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder="Subtask title..."
                                      value={subtaskDraft}
                                      onChange={e => setSubtaskDraft(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Escape') {
                                          setAddingSubtaskFor(null)
                                          setSubtaskDraft('')
                                        }
                                      }}
                                      className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-100 dark:focus:ring-amber-900/40"
                                    />
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="submit"
                                        disabled={!subtaskDraft.trim()}
                                        className="text-[9px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 px-1"
                                      >
                                        Add
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddingSubtaskFor(null)
                                          setSubtaskDraft('')
                                        }}
                                        className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingSubtaskFor(task.id)
                                      setSubtaskDraft('')
                                    }}
                                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors pt-0.5"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Add subtask</span>
                                  </button>
                                )
                              )}
                            </>
                          )
                        })()}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {COLUMNS.filter(c => c.id !== task.status).map(c => (
                          <button 
                            key={c.id} 
                            className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest py-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700" 
                            onClick={() => moveTask(task, c.id)}
                          >
                            <ArrowRight className="h-3 w-3" />
                            <span>{c.id === 'inprogress' ? 'Progress' : c.id === 'todo' ? 'To Do' : 'Done'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {getColumnTasks(col.id).length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-[0.2em] italic">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => deleteTask.mutate(taskToDelete.id)}
        title="Delete Task"
        message={`Are you sure you want to remove "${taskToDelete?.title}"? This cannot be undone.`}
        confirmText="Remove Task"
      />

      <ConfirmModal
        isOpen={!!tagToRemove}
        onClose={() => setTagToRemove(null)}
        onConfirm={confirmRemoveTag}
        title="Remove category"
        message={`"${tagToRemove?.tag}" is used on ${tagToRemove?.count} task(s). Remove it and clear the category from those tasks?`}
        confirmText="Remove category"
      />
    </div>
  )
}

export default TasksPage
