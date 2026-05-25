const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

const parseDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

router.get('/', authMiddleware, async (req, res) => {
  const year = parseInt(req.query.year, 10)
  const month = parseInt(req.query.month, 10)

  try {
    let where = { userId: req.userId }

    if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      const rangeStart = new Date(year, month - 1, 1)
      const rangeEnd = new Date(year, month, 0, 23, 59, 59, 999)
      where = {
        userId: req.userId,
        startAt: { gte: rangeStart, lte: rangeEnd }
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startAt: 'asc' }
    })
    res.json(events)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, startAt, endAt, allDay, color } = req.body
  const start = parseDate(startAt)
  if (!title?.trim() || !start) {
    return res.status(400).json({ message: 'Title and start date are required' })
  }

  const end = endAt ? parseDate(endAt) : null
  if (endAt && !end) {
    return res.status(400).json({ message: 'Invalid end date' })
  }

  try {
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startAt: start,
        endAt: end,
        allDay: Boolean(allDay),
        color: color || '#C8995A',
        userId: req.userId
      }
    })
    res.json(event)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, startAt, endAt, allDay, color } = req.body

  try {
    const existing = await prisma.event.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    })
    if (!existing) return res.status(404).json({ message: 'Event not found' })

    const data = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (startAt !== undefined) {
      const start = parseDate(startAt)
      if (!start) return res.status(400).json({ message: 'Invalid start date' })
      data.startAt = start
    }
    if (endAt !== undefined) {
      data.endAt = endAt ? parseDate(endAt) : null
      if (endAt && !data.endAt) return res.status(400).json({ message: 'Invalid end date' })
    }
    if (allDay !== undefined) data.allDay = Boolean(allDay)
    if (color !== undefined) data.color = color

    const event = await prisma.event.update({
      where: { id: existing.id },
      data
    })
    res.json(event)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.event.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId }
    })
    if (!existing) return res.status(404).json({ message: 'Event not found' })

    await prisma.event.delete({ where: { id: existing.id } })
    res.json({ message: 'Event deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
