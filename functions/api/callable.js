const admin = require('firebase-admin')

exports.submitProblemSolution = (data, ctx) => {
  console.log(data.raceId)
  return admin.database().ref('_race/' + data.raceId + '/problems').once('value')
    .then((problemsSnap) => {
    const problems = problemsSnap.val()
    console.log(problems)

    return admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).once('value')
      .then((playerSnap) => {
      const result = { correct: false }
      // Compare user solution to actual solution
      console.log(playerSnap.val().currentProblem)
      if (data.solution === problems[playerSnap.val().currentProblem].solution.toString()) {
        result.correct = true
        result.newFuel = 20
        // Set next problem
        result.nextProblem = problems[playerSnap.val().currentProblem + 1].question
        playerSnap.child('currentProblem').ref.set(playerSnap.val().currentProblem + 1)
      }
      
      return result
    })
  })
}
