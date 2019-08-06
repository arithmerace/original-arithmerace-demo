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
            const nextProblem = problems[playerSnap.val().currentProblem + 1]
            if (nextProblem === undefined) {
              result.finished = true
              return result
            }
            
            result.nextProblem = nextProblem.question
            playerSnap.child('currentProblem').ref.set(playerSnap.val().currentProblem + 1)
            playerSnap.child('fuel').ref.set(playerSnap.val().fuel + cfg.newFuel)
            playerSnap.child('updateTimestamp').ref.set(Date.now())
          }
          
          return result
        })
    })
}

exports.submitSpeedUpdate = (data, ctx) => {
  // Verify that a speed update actually occurred, and if so update player's fuel, speed, and progress.
  admin.database().ref('race/' + data.raceId).once('value')
    .then((snap) => {
      playerSnap = snap.child('player/' + ctx.auth.uid)
      if (playerSnap.val() === null) {
        console.error(`User ${ctx.auth.uid} not in race ${data.raceId}`)
        return
      }player.progress.was + (timeSinceLastSpeedChange * this.config.movementRate * player.speed.is)
      
      // Get last update
      const updateTimestampSnap = playerSnap.child('updateTimestamp')
      const timeSinceLastUpdate = Date.now() - (updateTimestampSnap.val() || snap.val().startTime)
      
      // calculate fuel remaining, and clamp to 0-100
      const fuel = Math.max(Math.min(Math.round(playerSnap.val().fuel - (timeSinceLastUpdate / 1000 * cfg.fuelConsumedPerSecond)), 100), 0)
      
      const speed = Math.floor((fuel - 1) / cfg.fuelSpeedInterval) + 1
      if (speed !== playerSnap.val().speed) {
        // Update fuel, speed, progress, and timestamp
        playerSnap.child('fuel').ref.set(fuel)
        playerSnap.child('speed').ref.set(speed)
        updateTimestampSnap.ref.set(Date.now())
        
        progress = playerSnap.val().progress + (timeSinceLastUpdate * cfg.movementRate * speed)
        playerSnap.child('progress').ref.set(progress)
      } else {
        console.warn(`submitSpeedUpdate called but speed hasn't changed`)
      }
    })
}

exports.exitRace = (data, ctx) => {
  if (!data.raceId) {
    admin.database().ref('waitingroom/' + ctx.auth.uid).remove()
    return
  }
  
  admin.database().ref('user/' + ctx.auth.uid + '/assignedRace').remove()
  admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).remove()
}
