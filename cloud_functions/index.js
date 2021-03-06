const functions = require('firebase-functions')
const admin = require('firebase-admin')

const raceApi = require('./api/race.js')
const userApi = require('./api/user.js')
const robotApi = require('./api/robot.js')
const ssrApp = require('./SSR.js')

admin.initializeApp();

/* Server-Side Renderer */
exports.ssrapp = functions.https.onRequest(ssrApp.app)

/* Race Management and API */
exports.convertWaitingRoomToGame = functions.database
  .ref('waitingroom/{user}')
  .onCreate(raceApi.convertWRtoGame)
exports.botFill = functions.https.onCall(raceApi.botFill)
exports.submitProblemSolution = functions.https.onCall(raceApi.submitProblemSolution)
exports.submitFinish = functions.https.onCall(raceApi.submitFinish)
exports.exitRace = functions.https.onCall(raceApi.exitRace)

/* User management */
exports.createNewUser = functions.https.onCall(userApi.createNewUser)

/* Robot management */
exports.purchaseRobot = functions.https.onCall(robotApi.purchaseRobot)
exports.equipRobot = functions.https.onCall(robotApi.equipRobot)

