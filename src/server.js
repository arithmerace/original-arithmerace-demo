import http from 'http'

import { Nuxt, Builder } from 'nuxt'
import express from 'express'
import SocketIO from 'socket.io'

const port = process.env.PORT || 3000
const isProd = process.env.NODE_ENV === 'production'

const app = express()
const server = http.createServer(app)
const io = SocketIO(server)

// Instantiate Nuxt.js with the options
const config = require('./nuxt.config.js')
config.dev = !isProd

// TODO API routes

const nuxt = new Nuxt(config)
// Start build process in dev mode
if (config.dev) {
  const builder = new Builder(nuxt)
  builder.build()
}
app.use(nuxt.render)

// Listen the server
server.listen(port, '0.0.0.0')
console.log('Server listening on localhost:' + port) // eslint-disable-line no-console

// TODO socket.io routes