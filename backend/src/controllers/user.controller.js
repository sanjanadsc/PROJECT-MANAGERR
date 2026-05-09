const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// get all users - admin only
const getUsers = async (req, res) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json({ success: true, users })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// search users by email (for adding to project)
const searchUsers = async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ success: false, message: 'Email query required' })

  try {
    const users = await prisma.user.findMany({
      where: { email: { contains: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, role: true },
      take: 10
    })
    res.json({ success: true, users })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = { getUsers, searchUsers }