import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import {
  Users,
  Target,
  Flame,
  Timer,
  Calendar,
  MessageSquare,
  ShieldCheck,
  X
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'

const AdminDashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null)

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['admin-insights'],
    queryFn: () => api.get('/admin/insights').then(r => r.data)
  })

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data)
  })

  const { data: feedbacks, isLoading: loadingFeedback } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: () => api.get('/admin/feedback').then(r => r.data)
  })

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => api.get('/admin/activity').then(r => r.data)
  })

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['admin-chart-data'],
    queryFn: () => api.get('/admin/stats/daily').then(r => r.data)
  })

  const statCards = [
    { label: 'Total Users', value: insights?.totalUsers, icon: Users },
    { label: 'Total Tasks', value: insights?.totalTasks, icon: Target },
    { label: 'Total Habits', value: insights?.totalHabits, icon: Flame },
    { label: 'Pomodoro Sessions', value: insights?.totalPomodoroSessions, icon: Timer },
    { label: 'Events Scheduled', value: insights?.totalEvents, icon: Calendar },
    ...(feedbacks && feedbacks.length > 0 ? [{ label: 'Feedback Received', value: insights?.totalFeedback, icon: MessageSquare }] : [])
  ]

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden bg-gray-50/30 dark:bg-gray-900/30">
      <div className="glass border-x-0 border-t-0 border-b border-white/40 dark:border-gray-800 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between shadow-sm shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#1C1814] dark:text-gray-100" />
            Admin Dashboard
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            System overview & insights
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Insights Grid */}
          <div>
            <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest mb-4">Platform Insights</h2>
            <div className={`grid grid-cols-2 md:grid-cols-3 ${statCards.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3 sm:gap-4`}>
              {statCards.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                  <stat.icon className="h-5 w-5 text-gray-400 mb-2" />
                  <div className="text-xl font-black text-gray-950 dark:text-gray-100">
                    {loadingInsights ? '-' : stat.value || 0}
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">7-Day Activity History</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Tasks completed & Pomodoros logged
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[220px] w-full">
              {loadingChart ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Loading chart data...
                </div>
              ) : chartData?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No activity data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#FFFFFF', 
                        border: '1px solid #F3F4F6', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '11px',
                        fontFamily: 'Inter, sans-serif'
                      }} 
                    />
                    <Legend 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', tracking: 'widest', color: '#9CA3AF', paddingTop: '10px' }}
                    />
                    <Bar dataKey="tasks" name="Tasks Completed" fill="#1C1814" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pomodoros" name="Pomodoro Sessions" fill="#C8995A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`grid grid-cols-1 ${feedbacks && feedbacks.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 lg:gap-8`}>
            {/* Users Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">Registered Users</h2>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                  {users?.length || 0} total
                </span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 border border-gray-100 dark:border-gray-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingUsers ? (
                      <tr><td colSpan="3" className="p-4 text-center text-xs text-gray-400">Loading users...</td></tr>
                    ) : users?.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-xs text-gray-400">No users found</td></tr>
                    ) : (
                      users?.map(u => (
                        <tr 
                          key={u.id} 
                          onClick={() => setSelectedUser(u)}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {u.isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-amber-500" title="Admin" />}
                            {u.name}
                          </td>
                          <td className="px-4 py-3 text-[10px] text-gray-500 dark:text-gray-400 font-medium">{u.email}</td>
                          <td className="px-4 py-3 text-[10px] text-gray-400 font-medium text-right">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">Recent Activity</h2>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                  Live feed
                </span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                {loadingActivities ? (
                  <div className="text-center text-xs text-gray-400 mt-10">Loading activity...</div>
                ) : activities?.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 mt-10 p-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    No recent activity.
                  </div>
                ) : (
                  activities?.map(a => {
                    const ActivityIcon = a.type === 'task' ? Target : a.type === 'habit' ? Flame : Timer;
                    const iconColor = a.type === 'task' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' : a.type === 'habit' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
                    return (
                      <div key={a.id} className="flex gap-3 items-start border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                        <div className={`p-2 rounded-xl shrink-0 ${iconColor}`}>
                          <ActivityIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{a.userName}</span> {a.detail}
                          </div>
                          <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(a.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Feedback List (rendered only if feedback exists) */}
            {feedbacks && feedbacks.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">User Feedback</h2>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {feedbacks.length} total
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                  {feedbacks.map(f => (
                    <div key={f.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-xs text-gray-900 dark:text-gray-100">{f.user.name}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{f.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl w-full max-w-md p-6 relative overflow-hidden animate-fadeUp">
            <button 
              onClick={() => setSelectedUser(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 flex items-start gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <Users className="h-6 w-6 text-[#1C1814] dark:text-gray-100" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-1.5 mt-0.5">
                  {selectedUser.name}
                  {selectedUser.isAdmin && (
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">Admin</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center">
                <Target className="h-4 w-4 text-gray-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-950 dark:text-gray-100">{selectedUser._count?.tasks ?? 0}</div>
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tasks</div>
              </div>
              <div className="bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center">
                <Flame className="h-4 w-4 text-gray-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-950 dark:text-gray-100">{selectedUser._count?.habits ?? 0}</div>
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Habits</div>
              </div>
              <div className="bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center">
                <Timer className="h-4 w-4 text-gray-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-gray-950 dark:text-gray-100">{selectedUser._count?.pomodoroSessions ?? 0}</div>
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Pomodoros</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
              <span>Member Since</span>
              <span className="text-gray-600 dark:text-gray-300">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
