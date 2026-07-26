const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const habitRoutes = require('./routes/habits')
const pomodoroRoutes = require('./routes/pomodoro')
const eventRoutes = require('./routes/events')
const adminRoutes = require('./routes/admin')
const feedbackRoutes = require('./routes/feedback')
const publicRoutes = require('./routes/public')
const insightsRoutes = require('./routes/insights')
const rateLimit = require('./middleware/rateLimit')

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, false)
  }
}))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many auth attempts. Try again later.' }
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/pomodoro', pomodoroRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/insights', insightsRoutes)

app.get('/', (req, res) => res.send('FlowSpace API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
