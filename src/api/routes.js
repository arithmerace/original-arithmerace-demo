const express = require('express')
const userApi = require('./handlers/user')
const router = express.Router()

router.post('/createNewUser', userApi.createNewUser)

module.exports = router
