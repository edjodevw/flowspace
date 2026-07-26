const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

router.post('/', authMiddleware, async (req, res) => {
  const { message } = req.body
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: 'Message is required' })
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        userId: req.userId
      }
    })
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ message: 'Error submitting feedback' })
  }
})

module.exports = router
