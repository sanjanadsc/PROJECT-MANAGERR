const { PrismaClient } = require('@prisma/client')
const { validationResult } = require('express-validator')

const prisma = new PrismaClient()

// get all projects for logged in user
const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          { members: { some: { userId: req.userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, projects })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// get single project
const getProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    // check if user is part of this project
    const isMember = project.ownerId === req.userId ||
      project.members.some(m => m.userId === req.userId)

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    res.json({ success: true, project })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// create project - only admins
const createProject = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only admins can create projects' })
  }

  const { name, description } = req.body

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.userId
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    })

    res.status(201).json({ success: true, message: 'Project created', project })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// update project
const updateProject = async (req, res) => {
  const { name, description } = req.body

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } })

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    if (project.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description }
    })

    res.json({ success: true, message: 'Project updated', project: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// delete project
const deleteProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } })

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    if (project.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// add member to project
const addMember = async (req, res) => {
  const { email } = req.body

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } })

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    if (project.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } })
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const alreadyMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId: project.id } }
    })

    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member' })
    }

    await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId: project.id, role: 'MEMBER' }
    })

    res.json({ success: true, message: 'Member added successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// remove member
const removeMember = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } })

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    if (project.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: { userId: req.params.memberId, projectId: req.params.id }
      }
    })

    res.json({ success: true, message: 'Member removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember }