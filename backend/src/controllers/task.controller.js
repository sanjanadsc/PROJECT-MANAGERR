const { PrismaClient } = require('@prisma/client')
const { validationResult } = require('express-validator')

const prisma = new PrismaClient()

// get tasks for a project
const getTasksByProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } })
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

    const isMember = project.ownerId === req.userId ||
      await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.userId, projectId: project.id } }
      })

    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' })

    const { status, priority, assigneeId } = req.query
    const filters = { projectId: req.params.projectId }
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (assigneeId) filters.assigneeId = assigneeId

    const tasks = await prisma.task.findMany({
      where: filters,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, tasks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// get all tasks assigned to logged in user
const getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.userId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, tasks })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// create task
const createTask = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { title, description, status, priority, dueDate, assigneeId, projectId } = req.body

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' })

    const isMember = project.ownerId === req.userId ||
      await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.userId, projectId } }
      })

    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' })

    // only admins or project owner can assign tasks to others
    let finalAssigneeId = req.userId
    if (assigneeId && (req.userRole === 'ADMIN' || project.ownerId === req.userId)) {
      finalAssigneeId = assigneeId
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: finalAssigneeId,
        creatorId: req.userId
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ success: true, message: 'Task created', task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// update task
const updateTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body

  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    })

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    const isOwnerOrAdmin = task.project.ownerId === req.userId || req.userRole === 'ADMIN'
    const isAssignee = task.assigneeId === req.userId

    if (!isOwnerOrAdmin && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    // members can only update status
    const updateData = {}
    if (status) updateData.status = status
    if (isOwnerOrAdmin) {
      if (title) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (priority) updateData.priority = priority
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    })

    res.json({ success: true, message: 'Task updated', task: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// delete task
const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    })

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    if (task.project.ownerId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    await prisma.task.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Task deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date()

    const [totalTasks, myTasks, overdueTasks, todoCount, inProgressCount, doneCount] = await Promise.all([
      prisma.task.count({ where: { assigneeId: req.userId } }),
      prisma.task.count({ where: { assigneeId: req.userId } }),
      prisma.task.count({
        where: {
          assigneeId: req.userId,
          dueDate: { lt: now },
          status: { not: 'DONE' }
        }
      }),
      prisma.task.count({ where: { assigneeId: req.userId, status: 'TODO' } }),
      prisma.task.count({ where: { assigneeId: req.userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { assigneeId: req.userId, status: 'DONE' } })
    ])

    const recentTasks = await prisma.task.findMany({
      where: { assigneeId: req.userId },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    res.json({
      success: true,
      stats: {
        totalTasks,
        myTasks,
        overdueTasks,
        todoCount,
        inProgressCount,
        doneCount,
        recentTasks
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = { getTasksByProject, getMyTasks, createTask, updateTask, deleteTask, getDashboardStats }