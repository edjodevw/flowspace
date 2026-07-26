const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalTasks, totalHabits] = await Promise.all([
      prisma.user.count(),
      prisma.task.count({ where: { status: 'done' } }),
      prisma.habit.count()
    ])

    res.json({
      totalUsers,
      totalTasks,
      totalHabits
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' })
  }
})

module.exports = router
