import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Star, 
  LayoutGrid, 
  Flame, 
  Timer, 
  BarChart3,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const heroRef = useRef(null)
  const featuresRef = useRef(null)

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalHabits: 0
  })

  const screenshots = [
    { src: '/flowss.png', title: 'Tasks' },
    { src: '/flowss2.png', title: 'Habits' },
    { src: '/flowss3.png', title: 'Pomodoro' },
    { src: '/flowss4.png', title: 'Calendar' }
  ]
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/public/stats')
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden selection:bg-gray-200 selection:text-gray-900 font-main transition-colors duration-300">
      {/* NAVBAR */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%]">
        <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg border-white/40">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
              <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-7 w-7" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight font-main">FlowSpace</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors font-main"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-premium !py-2 !px-5 text-sm font-main"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-amber-100/30 dark:bg-amber-900/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-amber-50/50 dark:bg-amber-900/20 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="reveal inline-flex items-center gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-gray-900 dark:text-gray-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-10 transition-all hover:bg-white/80 dark:hover:bg-gray-900/80 font-main">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Empowering {stats.totalUsers > 0 ? `${stats.totalUsers.toLocaleString()}+` : '...'} creators and professionals
          </div>

          <h1 className="reveal text-5xl md:text-7xl lg:text-8xl font-bold text-gray-950 dark:text-gray-100 leading-[0.95] mb-8 tracking-tighter font-main">
            Design your day.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800">
              Own your time.
            </span>
          </h1>

          <p className="reveal text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium font-main">
            The minimalist workspace that unifies your tasks, habits, and focus. Built for deep work and sustainable productivity.
          </p>


          {/* VISUAL SHOWCASE (SCREENSHOT CAROUSEL) */}
          <div className="reveal relative max-w-5xl mx-auto mt-12 md:mt-16">
            {/* Image container with smooth crossfade */}
            <div className="rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative" style={{ minHeight: '200px' }}>
              {screenshots.map((shot, idx) => (
                <img
                  key={shot.src}
                  src={shot.src}
                  alt={shot.title}
                  className="w-full h-auto object-contain drop-shadow-xl absolute inset-0"
                  style={{
                    opacity: idx === currentSlide ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    position: idx === currentSlide ? 'relative' : 'absolute'
                  }}
                />
              ))}
            </div>

            {/* Controls row: title + arrow buttons side-by-side */}
            <div className="flex items-center justify-between mt-4 px-1">
              <div className="flex items-center gap-2">
                {screenshots.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide ? 'w-6 bg-gray-900 dark:bg-gray-100' : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
                <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {screenshots[currentSlide]?.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlide(prev => (prev === 0 ? screenshots.length - 1 : prev - 1))}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 p-2.5 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Previous screenshot"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide(prev => (prev === screenshots.length - 1 ? 0 : prev + 1))}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 p-2.5 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Next screenshot"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - BENTO GRID */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight font-main">One platform. Infinite flow.</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium font-main">The essential toolkit for mindful productivity.</p>
        </div>

        <div className="bento-grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 h-auto md:h-[600px] gap-6">
          {/* Main Feature: Task Management */}
          <div className="bento-item md:col-span-2 md:row-span-2 reveal feature-card-new group font-main">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-gray-100 mb-8 group-hover:scale-110 transition-transform duration-500">
              <LayoutGrid className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Task Management</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
              A flexible kanban system designed to help you organize complex projects into actionable steps. Prioritize with precision.
            </p>
            <div className="mt-auto bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
               <div className="space-y-3">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                     <div className="w-5 h-5 rounded border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center">
                       {i === 1 && <Check className="h-3 w-3 text-gray-900 dark:text-gray-100" />}
                     </div>
                     <div className={`h-2 rounded-full bg-gray-100 dark:bg-gray-800 ${i === 1 ? 'w-24' : i === 2 ? 'w-32' : 'w-20'}`} />
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Feature: Habit Tracking */}
          <div className="bento-item md:col-span-2 reveal feature-card-new group font-main">
            <div className="flex flex-col md:flex-row gap-8 h-full">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-700 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:rotate-12 transition-transform duration-500">
                  <Flame className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Habit Streaks</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                  Consistency is key. Track your daily rituals and watch your momentum build over time.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg ${i < 9 ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-gray-100 dark:bg-gray-800'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature: Pomodoro */}
          <div className="bento-item reveal feature-card-new group font-main">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-gray-800 border border-red-100 dark:border-gray-700 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 group-hover:scale-90 transition-transform duration-500">
              <Timer className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Deep Focus</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
              Integrated Pomodoro timer to maintain peak concentration.
            </p>
          </div>

          {/* Feature: Analytics */}
          <div className="bento-item reveal feature-card-new group bg-gray-900 !text-white border-gray-800 font-main">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-6 group-hover:translate-x-1 transition-transform">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Insights</h3>
            <p className="text-gray-400 text-xs font-medium leading-relaxed">
              Visualize your progress with beautiful, intuitive analytics.
            </p>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="reveal max-w-6xl mx-auto px-6 pb-32">
        <div className="glass rounded-[40px] p-12 md:p-20 flex flex-col md:flex-row gap-12 md:gap-8 items-center justify-between shadow-2xl border-white/20 font-main">
          {[
            { value: stats.totalTasks > 0 ? `${stats.totalTasks.toLocaleString()}+` : '...', label: 'Tasks Completed', icon: Sparkles, color: 'text-gray-900 dark:text-gray-100' },
            { value: stats.totalHabits > 0 ? `${stats.totalHabits.toLocaleString()}+` : '...', label: 'Habits Tracked', icon: Flame, color: 'text-gray-900 dark:text-gray-100' },
            { value: stats.totalUsers > 0 ? `${stats.totalUsers.toLocaleString()}+` : '...', label: 'Active Users', icon: Star, color: 'text-gray-900 dark:text-gray-100' }
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center group">
                <div className={`flex justify-center mb-6 group-hover:scale-125 transition-transform duration-500 ${s.color}`}>
                  <Icon className="h-10 w-10" />
                </div>
                <div className="text-5xl font-black text-gray-950 dark:text-gray-100 mb-2 tracking-tighter">{s.value}</div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="reveal max-w-6xl mx-auto px-6 pb-32">
          <div className="relative rounded-[40px] overflow-hidden p-16 md:p-24 text-center">
            <div className="absolute inset-0 bg-gray-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(200,153,90,0.3),transparent_70%)]" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto font-main">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to master your workflow?</h2>
              <p className="text-gray-400 text-lg mb-12 font-medium">Join thousands of others building their best selves on FlowSpace.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-gold-premium !px-12 !py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  <span>Sign up for free</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 dark:border-gray-800 gap-8 font-main">
        <div className="flex items-center gap-3">
          <div className="bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
            <img src="/flowspace-icon.svg" alt="FlowSpace" className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">FlowSpace</span>
        </div>
        <div className="flex gap-8">
          <a 
            href="https://www.linkedin.com/in/eduard-joseph-di%C3%B1o-81418738a/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              LinkedIn
          </a>
          <a 
            href="https://github.com/eduardwewew" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Github
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <ShieldCheck className="h-4 w-4" />
          <span>© 2026 FlowSpace · Crafted by Design</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage