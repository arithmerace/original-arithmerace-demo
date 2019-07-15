const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const { Nuxt } = require('nuxt-start')

admin.initializeApp();

const isProd = functions.config().env.prod

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