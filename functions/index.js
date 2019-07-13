// const functions = require('firebase-functions')
// const { Nuxt } = require('nuxt-start')

// const app = require('express')()
// const isProd = true

// // We instantiate Nuxt.js with the options
// const nconfig = require('./nuxt.config.js')
// const config = {
//   buildDir: 'nuxt',
//   dev: !isProd,
//   debug: !isProd
// }

// const nuxt = new Nuxt(config)

// // Render every route with Nuxt.js
// app.use(nuxt.render)

// // // Build only in dev mode with hot-reloading
// // if (config.dev) {
// //   new Builder(nuxt).build()
// //   .then(listen)
// // }

// exports.ssrapp = functions.https.onRequest(app)

const functions = require('firebase-functions')
const express = require('express')
const { Nuxt } = require('nuxt-start')

const app = express()

const config = {
  dev: false,
  debug: false,
  buildDir: 'nuxt'
}
const nuxt = new Nuxt(config)

function handleRequest(req, res) {
  // res.set('Cache-Control', 'public, max-age=600, s-maxage=1200')
  nuxt.renderRoute(req.url).then(result => {
    res.send(result.html)
  }).catch(e => {
    res.send(e)
  })
}

app.get('*', handleRequest)
exports.ssrapp = functions.https.onRequest(app)