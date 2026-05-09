const express = require('express')
const { body } = require('express-validator')
const {
  getTasksByProject, getMyTasks, createTask,
  updateTask, deleteTask, getDashboardStats
} = require('../controllers/task.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)

router.get('/dashboard', getDashboardStats)
router.get('/my', getMyTasks)
router.get('/project/:projectId', getTasksByProject)

router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required')
], createTask)

router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

module.exports = router