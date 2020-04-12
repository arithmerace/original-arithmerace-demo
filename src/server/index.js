const http = require('http')
const express = require('express')
const SocketIO = require('socket.io')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const conf = require('../config/config')
const apiRoutes = require('../api/routes')
const socketManager = require('../sockets/manager')
const User = require('../api/models/user')

const app = express()
const server = http.createServer(app)
const io = SocketIO(server)

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

// Set up Mongo database
const DB_URI = process.env.MONGODB_URI || global.gConfig.db_uri
mongoose.connect(DB_URI, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// Set up passport local mongoose auth
passport.use({
  usernameField: 'username',
  passwordField: 'password'
}, new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)
  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // TODO API routes
  app.use('/api', apiRoutes)

  // Give nuxt middleware to express
  app.use(nuxt.render)

  socketManager(io)

  // Listen the server
  server.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })

}
start()
