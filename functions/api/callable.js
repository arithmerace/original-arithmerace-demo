const admin = require('firebase-admin')
const cfg = require('./config.json')

exports.submitProblemSolution = (data, ctx) => {
  return admin.database().ref('_race/' + data.raceId + '/problems').once('value')
    .then((problemsSnap) => {
      const problems = problemsSnap.val()
  
      return admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).once('value')
        .then((playerSnap) => {
          const result = { correct: false, serverTime: Date.now() }
          // Compare user solution to actual solution
          if (data.solution === problems[playerSnap.val().currentProblem].solution.toString()) {
            result.correct = true
            // Set next problem
            const nextProblem = problems[playerSnap.val().currentProblem + 1]
            if (nextProblem === undefined) {
              result.finished = true
              playerSnap.child('finished').ref.set(true)
              return result
            }
            result.nextProblem = nextProblem.question
            playerSnap.child('currentProblem').ref.set(playerSnap.val().currentProblem + 1)
            
            const newBattery = { used: Date.now() }
            result.newBatteries = [newBattery]
            playerSnap.child('batteries').ref.push(newBattery)
          }
          
          return result
        })
    })
}

exports.submitFinish = (data, ctx) => {
  // Validate finish and return position
}

exports.exitRace = (data, ctx) => {
  admin.database().ref('user/' + ctx.auth.uid + '/assignedRace').remove()
  
  if (!data.raceId) {
    admin.database().ref('waitingroom/' + ctx.auth.uid).remove()
    return
  }

  admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).remove()
}
