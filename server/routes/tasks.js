const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')

const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(tasks)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { title, status, priority, tag, dueDate, subtasks } = req.body
  try {
    const task = await prisma.task.create({
      data: {
        title,
        status: status || 'todo',
        priority: priority || 'medium',
        tag: tag || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtasks: subtasks ?? [],
        userId: req.userId
      }
    })
    res.json(task)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, status, priority, tag, dueDate, subtasks } = req.body
  try {
    const data = {}
    if (title !== undefined) data.title = title
    if (status !== undefined) data.status = status
    if (priority !== undefined) data.priority = priority
    if (tag !== undefined) data.tag = tag
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (subtasks !== undefined) data.subtasks = subtasks

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data
    })
    res.json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Task deleted' })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router