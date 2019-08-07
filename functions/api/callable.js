const admin = require('firebase-admin')
const cfg = require('./config.json')

function updatePlayer(data, ctx) {
  // This should behave the same as the client-side version, the update method

  return admin.database().ref('race/' + data.raceId).once('value')
    .then((snap) => {
      playerSnap = snap.child('player/' + ctx.auth.uid)
      if (playerSnap.val() === null) {
        console.error(`User ${ctx.auth.uid} not in race ${data.raceId}`)
        return
      }
      
      // Get last update
      const updateTimestampSnap = playerSnap.child('updateTimestamp')
      const timeSinceLastUpdate = Date.now() - (updateTimestampSnap.val() || snap.val().startTime) / 1000
      
      // Calculate fuel remaining, and clamp to 0-100
      const fuel = Math.max(Math.min(Math.round(playerSnap.val().fuel - timeSinceLastUpdate * cfg.fuelConsumedPerSecond), 100), 0)
      
      // Calculate speed based on fuel
      const speed = Math.floor((fuel - 1) / cfg.fuelSpeedInterval) + 1
      
      // Calculate progress based on speed
      const progress = playerSnap.val().progress + (timeSinceLastUpdate * cfg.movementRate * speed)

      // Update fuel, speed, progress, and timestamp
      updateTimestampSnap.ref.set(Date.now())
      playerSnap.child('fuel').ref.set(fuel)
      playerSnap.child('speed').ref.set(speed)
      playerSnap.child('progress').ref.set(progress)
      
      // Return updated data
      return {
        fuel,
        speed,
        progress
      }
    })
}

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
            
            // Update player, then add fuel
            updatePlayer({ raceId: data.raceId }, ctx).then((updated) => {
              playerSnap.child('fuel').ref.set(updated.fuel + cfg.newFuel)
            })
          }
          
          return result
        })
    })
}

exports.submitSpeedUpdate = (data, ctx) => {
  updatePlayer(data, ctx)
}

exports.exitRace = (data, ctx) => {
  admin.database().ref('user/' + ctx.auth.uid + '/assignedRace').remove()
  
  if (!data.raceId) {
    admin.database().ref('waitingroom/' + ctx.auth.uid).remove()
    return
  }

  admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).remove()
}
