const functions = require('firebase-functions')
const admin = require('firebase-admin')

const raceApi = require('./api/race.js')
const userApi = require('./api/user.js')
const ssrApp = require('./SSR.js')

admin.initializeApp();

/* Server-Side Renderer */
exports.ssrapp = functions.https.onRequest(ssrApp)

/* Race Management and API */
exports.convertWaitingRoomToGame = functions.database
  .ref('waitingroom/{user}')
  .onCreate(raceApi.convertWRtoGame)
  
exports.submitProblemSolution = functions.https.onCall(raceApi.submitProblemSolution)
exports.submitFinish = functions.https.onCall(raceApi.submitFinish)
exports.exitRace = functions.https.onCall(raceApi.exitRace)

/* User management */
exports.onNewUser = functions.auth.user().onCreate(userApi.onNewUser)
// TODO manage user status