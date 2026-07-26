// Simple in-memory rate limiter (no external dependency).
// Keyed by IP; suitable for a single-server deploy.
const hits = new Map()

const cleanup = (windowMs) => {
  const now = Date.now()
  for (const [key, entry] of hits.entries()) {
    if (now - entry.start >= windowMs) hits.delete(key)
  }
}

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 30, message } = {}) => {
  return (req, res, next) => {
    cleanup(windowMs)
    const key = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    let entry = hits.get(key)
    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 }
      hits.set(key, entry)
    }
    entry.count += 1
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    if (entry.count > max) {
      return res.status(429).json(
        message || { message: 'Too many requests. Try again later.' }
      )
    }
    next()
  }
}

module.exports = rateLimit
