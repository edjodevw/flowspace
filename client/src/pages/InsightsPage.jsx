import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Timer,
  Calendar,
  ListTodo,
  TrendingUp
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

const InsightsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['insights-summary'],
    queryFn: () => api.get('/insights/summary').then((r) => r.data)
  })

  const cards = [
    { label: 'Tasks done (7d)', value: data?.tasksDoneWeek, icon: CheckCircle2 },
    { label: 'Active tasks', value: data?.tasksActive, icon: ListTodo },
    { label: 'Habits today', value: data ? `${data.habitsDoneToday}/${data.habitsTotal}` : null, icon: Flame },
    { label: 'Best streak', value: data?.bestStreak, icon: TrendingUp },
    { label: 'Focus minutes (7d)', value: data?.focusMinutesWeek, icon: Timer },
    { label: 'Upcoming events', value: data?.eventsUpcoming, icon: Calendar }
  ]

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden bg-gray-50/30 dark:bg-gray-900/30">
      <div className="glass border-x-0 border-t-0 border-b border-white/40 dark:border-gray-800 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between shadow-sm shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#1C1814] dark:text-gray-100" />
            Insights
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Your week at a glance
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {isError && (
            <p className="text-sm text-red-500 font-medium">Unable to load insights. Try refreshing.</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {cards.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center"
              >
                <stat.icon className="h-5 w-5 text-gray-400 mb-2" />
                <div className="text-xl font-black text-gray-950 dark:text-gray-100">
                  {isLoading ? '—' : (stat.value ?? 0)}
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 overflow-hidden flex flex-col min-h-[320px]">
            <div className="mb-4 shrink-0">
              <h2 className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">
                7-Day Activity
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Tasks completed, habit check-ins &amp; pomodoros
              </p>
            </div>
            <div className="flex-1 min-h-[220px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Loading chart...
                </div>
              ) : !data?.daily?.length ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No activity yet — complete a task or habit to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #F3F4F6',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '11px'
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#9CA3AF',
                        paddingTop: '10px'
                      }}
                    />
                    <Bar dataKey="tasks" name="Tasks" fill="#1C1814" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="habitChecks" name="Habits" fill="#C8995A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pomodoros" name="Pomodoros" fill="#6B7280" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsightsPage
