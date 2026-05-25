const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      include: { logs: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(habits)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body
  try {
    const habit = await prisma.habit.create({
      data: { name, userId: req.userId },
      include: { logs: true }
    })
    res.json(habit)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:id/log', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.habitLog.create({
      data: { habitId: parseInt(req.params.id) }
    })
    res.json(log)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id/log', authMiddleware, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await prisma.habitLog.deleteMany({
      where: {
        habitId: parseInt(req.params.id),
        date: { gte: today, lt: tomorrow }
      }
    })
    res.json({ message: 'Log removed' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.habitLog.deleteMany({ where: { habitId: parseInt(req.params.id) } })
    await prisma.habit.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Habit deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router