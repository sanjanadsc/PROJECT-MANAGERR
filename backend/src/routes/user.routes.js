const express = require('express')
const { getUsers, searchUsers } = require('../controllers/user.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)

router.get('/', getUsers)
router.get('/search', searchUsers)

module.exports = router