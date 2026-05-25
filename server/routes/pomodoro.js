const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json(sessions)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { duration, type } = req.body
  try {
    const session = await prisma.pomodoroSession.create({
      data: { duration, type, userId: req.userId }
    })
    res.json(session)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router