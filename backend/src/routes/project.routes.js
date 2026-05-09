const express = require('express')
const { body } = require('express-validator')
const {
  getProjects, getProject, createProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/project.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)

router.get('/', getProjects)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required')
], createProject)

router.get('/:id', getProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)

router.post('/:id/members', addMember)
router.delete('/:id/members/:memberId', removeMember)

module.exports = router