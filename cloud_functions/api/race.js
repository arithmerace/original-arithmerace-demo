const admin = require('firebase-admin')
const cfg = require('./config.json')

exports.convertWRtoGame = function(snap, ctx) {
  snap.ref.parent.once("value", (wrsnap, ctx) => {
    if (wrsnap.numChildren() == cfg.playersToStartRace) {
      // Create new game ref
      const raceRef = admin.database().ref('race').push()
      
      let lane = 1
      wrsnap.forEach((player) => {
        // For each player in waiting room, add player data to race then remove player from waiting room
        admin.database().ref('user/' + player.key).once('value', (userSnap) => {
          raceRef.child('player/' + player.key).set({
            name: (userSnap.val()) ? userSnap.val().profile.username : 'Guest',
            batteries: {},
            finished: false,
            currentProblem: 0,
            lane
          })
          
          userSnap.child('assignedRace').ref.set(raceRef.key)
          
          player.ref.remove()
        
          lane ++
        })
      })
      // Generate math problems
      const problems = {}
      for (i=0; i<cfg.numProblemsPerRace; i++) {
        const problem = {}
        problem.op = ['+', '-', '/', '*'][Math.floor(Math.random()*4)]
        problem.n1 = Math.floor(Math.random()*12)
        problem.n2 = Math.floor(Math.random()*12)
        if (problem.op === '/' && problem.n1 % problem.n2 !== 0) {
          // For now, only allow division if there isn't a remainder
          problem.op = '*' // do multiplication instead
        }
        problem.question = `${problem.n1} ${problem.op} ${problem.n2}`
        problem.solution = eval(problem.question)
        problems[i] = problem
      }
      // the '_race' ref is used for hidden race data
      admin.database().ref('_race/' + raceRef.key).child('problems').set(problems)
      setTimeout(() => {
        raceRef.child('player').once('value', (playersSnap) => {
          playersSnap.forEach((player) => {
            // Give player 1 battery to start with
            player.child('batteries').ref.push({ used: Date.now() })
          })
          raceRef.child('firstProblem').set(problems[0].question)
        })
      }, cfg.raceStartDelay)
    }
  })
}

exports.submitProblemSolution = function(data, ctx) {
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

exports.submitFinish = function(data, ctx) {
  // TODO Validate finish and return position
}

exports.exitRace = function(data, ctx) {
  admin.database().ref('user/' + ctx.auth.uid + '/assignedRace').remove()
  
  if (!data.raceId) {
    admin.database().ref('waitingroom/' + ctx.auth.uid).remove()
    return
  }

  admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).remove()
}
