const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admins only' })
    }
    next()
  } catch (err) {
    res.status(500).json({ message: 'Server error checking permissions' })
  }
}
