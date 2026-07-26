const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const dayLabel = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })

const dayKey = (d) =>
  d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setHours(0, 0, 0, 0)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      tasksDoneWeek,
      tasksActive,
      habits,
      pomodorosWeek,
      focusMinutes,
      eventsUpcoming
    ] = await Promise.all([
      prisma.task.count({
        where: {
          userId: req.userId,
          status: 'done',
          OR: [
            { completedAt: { gte: sevenDaysAgo } },
            { completedAt: null, createdAt: { gte: sevenDaysAgo }, status: 'done' }
          ]
        }
      }),
      prisma.task.count({
        where: { userId: req.userId, status: { not: 'done' } }
      }),
      prisma.habit.findMany({
        where: { userId: req.userId },
        include: { logs: { orderBy: { date: 'desc' } } }
      }),
      prisma.pomodoroSession.findMany({
        where: { userId: req.userId, createdAt: { gte: sevenDaysAgo } },
        select: { duration: true, type: true, createdAt: true }
      }),
      prisma.pomodoroSession.aggregate({
        where: {
          userId: req.userId,
          type: 'focus',
          createdAt: { gte: sevenDaysAgo }
        },
        _sum: { duration: true }
      }),
      prisma.event.count({
        where: { userId: req.userId, startAt: { gte: todayStart } }
      })
    ])

    const getStreak = (logs) => {
      if (!logs?.length) return 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let streak = 0
      const current = new Date(today)
      while (true) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
        const found = logs.some((log) => {
          if (log.day) return log.day === key
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

    const todayKeyStr = `${todayStart.getFullYear()}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${String(todayStart.getDate()).padStart(2, '0')}`
    const habitsDoneToday = habits.filter((h) =>
      h.logs.some((l) => l.day === todayKeyStr || (() => {
        const d = new Date(l.date)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === todayStart.getTime()
      })())
    ).length

    const bestStreak = habits.reduce((max, h) => Math.max(max, getStreak(h.logs)), 0)

    const statsMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = dayKey(d)
      statsMap[key] = { label: dayLabel(d), tasks: 0, pomodoros: 0, habitChecks: 0 }
    }

    const [doneTasks, habitLogsWeek] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: req.userId,
          status: 'done',
          OR: [
            { completedAt: { gte: sevenDaysAgo } },
            { completedAt: null, createdAt: { gte: sevenDaysAgo } }
          ]
        },
        select: { completedAt: true, createdAt: true }
      }),
      prisma.habitLog.findMany({
        where: {
          habit: { userId: req.userId },
          date: { gte: sevenDaysAgo }
        },
        select: { date: true, day: true }
      })
    ])

    doneTasks.forEach((t) => {
      const when = t.completedAt || t.createdAt
      const key = dayKey(new Date(when))
      if (statsMap[key]) statsMap[key].tasks++
    })

    pomodorosWeek.forEach((p) => {
      const key = dayKey(new Date(p.createdAt))
      if (statsMap[key]) statsMap[key].pomodoros++
    })

    habitLogsWeek.forEach((l) => {
      const key = l.day
        ? (() => {
            const [y, m, d] = l.day.split('-').map(Number)
            return dayKey(new Date(y, m - 1, d))
          })()
        : dayKey(new Date(l.date))
      if (statsMap[key]) statsMap[key].habitChecks++
    })

    res.json({
      tasksDoneWeek,
      tasksActive,
      habitsTotal: habits.length,
      habitsDoneToday,
      bestStreak,
      pomodoroSessionsWeek: pomodorosWeek.length,
      focusMinutesWeek: focusMinutes._sum.duration || 0,
      eventsUpcoming,
      daily: Object.values(statsMap)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error fetching insights' })
  }
})

module.exports = router
