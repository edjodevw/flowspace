const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const habitRoutes = require('./routes/habits')
const pomodoroRoutes = require('./routes/pomodoro')
const eventRoutes = require('./routes/events')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/pomodoro', pomodoroRoutes)
app.use('/api/events', eventRoutes)

app.get('/', (req, res) => res.send('FlowSpace API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))