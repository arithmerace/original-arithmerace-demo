const http = require('http')
const express = require('express')
const SocketIO = require('socket.io')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const apiRoutes = require('../api/routes')
const socketManager = require('../sockets/manager')

const app = express()
const server = http.createServer(app)
const io = SocketIO(server)

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

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
