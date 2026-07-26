const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')
const adminMiddleware = require('../middleware/admin')

const prisma = new PrismaClient()

router.use(authMiddleware, adminMiddleware)

router.get('/insights', async (req, res) => {
  try {
    const [totalUsers, totalTasks, totalHabits, totalPomodoroSessions, totalEvents, totalFeedback] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.habit.count(),
      prisma.pomodoroSession.count(),
      prisma.event.count(),
      prisma.feedback.count()
    ])

    res.json({
      totalUsers,
      totalTasks,
      totalHabits,
      totalPomodoroSessions,
      totalEvents,
      totalFeedback
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching insights' })
  }
})

router.get('/activity', async (req, res) => {
  try {
    const [tasks, habitLogs, pomodoros] = await Promise.all([
      prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      }),
      prisma.habitLog.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: { habit: { include: { user: { select: { name: true } } } } }
      }),
      prisma.pomodoroSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      })
    ])

    const activities = [
      ...tasks.map(t => ({
        id: `task-${t.id}`,
        type: 'task',
        userName: t.user?.name || 'Unknown User',
        detail: `Created task "${t.title}"`,
        timestamp: t.createdAt
      })),
      ...habitLogs.map(hl => ({
        id: `habit-${hl.id}`,
        type: 'habit',
        userName: hl.habit?.user?.name || 'Unknown User',
        detail: `Checked in habit "${hl.habit?.name}"`,
        timestamp: hl.date
      })),
      ...pomodoros.map(p => ({
        id: `pomodoro-${p.id}`,
        type: 'pomodoro',
        userName: p.user?.name || 'Unknown User',
        detail: `Completed a ${p.duration}-min Pomodoro (${p.type})`,
        timestamp: p.createdAt
      }))
    ]

    // Sort by timestamp desc and take top 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    res.json(activities.slice(0, 10))
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recent activity' })
  }
})

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            habits: true,
            pomodoroSessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' })
  }
})

router.get('/stats/daily', async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setHours(0, 0, 0, 0)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [tasks, pomodoros] = await Promise.all([
      prisma.task.findMany({
        where: {
          status: 'done',
          OR: [
            { completedAt: { gte: sevenDaysAgo } },
            { completedAt: null, createdAt: { gte: sevenDaysAgo } }
          ]
        },
        select: { completedAt: true, createdAt: true }
      }),
      prisma.pomodoroSession.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo }
        },
        select: { createdAt: true }
      })
    ])

    // Group in memory by completion time (falls back to createdAt for legacy rows)
    const statsMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
      statsMap[key] = { label, tasks: 0, pomodoros: 0 }
    }

    tasks.forEach(t => {
      const when = t.completedAt || t.createdAt
      const key = new Date(when).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      if (statsMap[key]) {
        statsMap[key].tasks++
      }
    })

    pomodoros.forEach(p => {
      const key = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      if (statsMap[key]) {
        statsMap[key].pomodoros++
      }
    })

    const stats = Object.values(statsMap)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching daily stats' })
  }
})

router.get('/feedback', async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback' })
  }
})

module.exports = router
