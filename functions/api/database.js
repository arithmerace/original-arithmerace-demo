const admin = require('firebase-admin')

const cfg = require('./config.json')

exports.convertWRtoGame = (snap, ctx) => {
  snap.ref.parent.once("value", (wrsnap, ctx) => {
    if (wrsnap.numChildren() == cfg.playersToStartRace) {
      // Create new game ref
      const raceRef = admin.database().ref('race').push()
      raceRef.child('started').set(false)
      
      let lane = 1
      wrsnap.forEach((player) => {
        // For each player in waiting room, add player data to race then remove player from waiting room
        raceRef.child('player/' + player.key).set({
          progress: 0,
          speed: 1,
          fuel: cfg.startingFuel,
          updateTimestamp: null,
          currentProblem: 0,
          lane
        })
        
        admin.database().ref('user/' + player.key).child('assignedRace').set(raceRef.key)
        
        player.ref.remove()
        
        lane ++
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
        raceRef.child('startTime').set(Date.now())
        raceRef.child('firstProblem').set(problems[0].question)
      }, cfg.raceStartDelay)
    }
  })
}
