const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const findOwnedHabit = (habitId, userId) =>
  prisma.habit.findFirst({
    where: { id: habitId, userId }
  })

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
  const name = req.body.name?.trim()
  if (!name) return res.status(400).json({ message: 'Habit name is required' })

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

router.put('/:id', authMiddleware, async (req, res) => {
  const name = req.body.name?.trim()
  if (!name) return res.status(400).json({ message: 'Habit name is required' })

  try {
    const existing = await findOwnedHabit(parseInt(req.params.id), req.userId)
    if (!existing) return res.status(404).json({ message: 'Habit not found' })

    const habit = await prisma.habit.update({
      where: { id: existing.id },
      data: { name },
      include: { logs: true }
    })
    res.json(habit)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:id/log', authMiddleware, async (req, res) => {
  try {
    const habitId = parseInt(req.params.id)
    const existing = await findOwnedHabit(habitId, req.userId)
    if (!existing) return res.status(404).json({ message: 'Habit not found' })

    const day = todayKey()
    const already = await prisma.habitLog.findUnique({
      where: { habitId_day: { habitId, day } }
    })
    if (already) return res.status(400).json({ message: 'Already logged today' })

    const log = await prisma.habitLog.create({
      data: { habitId, day, date: new Date() }
    })
    res.json(log)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Already logged today' })
    }
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id/log', authMiddleware, async (req, res) => {
  try {
    const habitId = parseInt(req.params.id)
    const existing = await findOwnedHabit(habitId, req.userId)
    if (!existing) return res.status(404).json({ message: 'Habit not found' })

    await prisma.habitLog.deleteMany({
      where: { habitId, day: todayKey() }
    })
    res.json({ message: 'Log removed' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await findOwnedHabit(parseInt(req.params.id), req.userId)
    if (!existing) return res.status(404).json({ message: 'Habit not found' })

    await prisma.habitLog.deleteMany({ where: { habitId: existing.id } })
    await prisma.habit.delete({ where: { id: existing.id } })
    res.json({ message: 'Habit deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
