const admin = require('firebase-admin')
const cfg = require('./config.json')

exports.submitProblemSolution = (data, ctx) => {
  return admin.database().ref('_race/' + data.raceId + '/problems').once('value')
    .then((problemsSnap) => {
      const problems = problemsSnap.val()
  
      return admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).once('value')
        .then((playerSnap) => {
          const result = { correct: false }
          // Compare user solution to actual solution
          if (data.solution === problems[playerSnap.val().currentProblem].solution.toString()) {
            result.correct = true
            // Set next problem
            result.nextProblem = problems[playerSnap.val().currentProblem + 1].question
            playerSnap.child('currentProblem').ref.set(playerSnap.val().currentProblem + 1)
            playerSnap.child('fuel').ref.set(playerSnap.val().fuel + cfg.newFuel)
            playerSnap.child('updateTimestamp').ref.set(Date.now())
          }
          
          return result
        })
    })
}

exports.submitFuelLevelUpdate = (data, ctx) => {
  //return message on error
  admin.database().ref('race/' + data.raceId).once('value')
    .then((snap) => {
      playerSnap =snap.child('player/' + ctx.auth.uid)
      if (playerSnap.val() === null) {
        console.error(`User ${ctx.auth.uid} not in race ${data.raceId}`)
        return
      }
      
      // Get last update
      const updateTimestamp = playerSnap.child('updateTimestamp')
      const timeSinceLastUpdate = Date.now() - (updateTimestamp.val() || snap.val().startTime)
      
      // calculate fuel remaining, and clamp to 0-100
      const newFuel = Math.max(Math.min(Math.round(playerSnap.val().fuel - (timeSinceLastUpdate / 1000 * cfg.fuelConsumedPerSecond)), 100), 0)
      
      playerSnap.child('fuel').ref.set(newFuel)
        
      updateTimestamp.ref.set(Date.now())
    })
}
