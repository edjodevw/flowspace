const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email })

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(publicUser(user))
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
})

router.put('/profile', authMiddleware, async (req, res) => {
  const name = req.body.name?.trim()
  const email = req.body.email?.trim().toLowerCase()

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== req.userId) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, email }
    })

    res.json(publicUser(user))
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed }
    })

    res.json({ message: 'Password updated' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/account', authMiddleware, async (req, res) => {
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ message: 'Password is required' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Password is incorrect' })

    await prisma.$transaction([
      prisma.habitLog.deleteMany({ where: { habit: { userId: req.userId } } }),
      prisma.task.deleteMany({ where: { userId: req.userId } }),
      prisma.pomodoroSession.deleteMany({ where: { userId: req.userId } }),
      prisma.event.deleteMany({ where: { userId: req.userId } }),
      prisma.habit.deleteMany({ where: { userId: req.userId } }),
      prisma.user.delete({ where: { id: req.userId } })
    ])

    res.json({ message: 'Account deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
