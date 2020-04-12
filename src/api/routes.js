const express = require('express')
const userApi = require('./handlers/user')
const router = express.Router()

router.get('/createNewUser', userApi.createNewUser)

module.exports = router
