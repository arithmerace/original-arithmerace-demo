const admin = require('firebase-admin')
const cfg = require('./config.json')

function generateNewProblem() {
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
  return problem
}

function checkForEndOfRace(playersFinished, raceId) {
  admin.database().ref('race/' + raceId + '/player').once('value')
    .then((snap) => {
      if (snap.val().length === playersFinished) { // All players have finished
        // Delete race
        snap.ref.parent.remove()
        admin.database().ref('_race'+ raceId).remove()
      }
    })
}

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
            name: (userSnap.val()) ? userSnap.val().username : 'Guest',
            robot: (userSnap.val()) ? userSnap.val().robot : 'guest_bot',
            batteries: {},
            finished: false,
            finalPosition: null,
            currentProblem: 0,
            lane
          })
          
          userSnap.child('assignedRace').ref.set(raceRef.key)
          
          player.ref.remove()
        
          lane ++
        })
      })
      // Generate math problems
      const problems = [generateNewProblem()]
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
          if (!playerSnap.val()) {
            console.warn(`Player ${ctx.auth.uid} not in race ${data.raceId}`)
            return
          }
          
          const result = { correct: false, serverTime: Date.now() }
          // Compare user solution to actual solution
          if (data.solution === problems[playerSnap.val().currentProblem].solution.toString()) {
            result.correct = true
            // Set next problem
            let nextProblem = problems[playerSnap.val().currentProblem + 1]
            // If there are no more problems, create a new one.
            if (nextProblem === undefined) {
              nextProblem = generateNewProblem()
              problemsSnap.ref.child(playerSnap.val().currentProblem + 1).set(nextProblem)
              
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
  return admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).once('value')
    .then((playerSnap) => {
      if (!playerSnap.val()) {
        console.warn(`Player ${ctx.auth.uid} not in race ${data.raceId}`)
        return { success: false }
      }
      
      // Verify that player is finished
      let progress = 0
      for (const battery of Object.values(playerSnap.val().batteries)) {
        const timeSinceUsed = ((Date.now()) - battery.used) / 1000
        if (timeSinceUsed > cfg.batteryLifeSpan) {
          progress += cfg.batteryProgressPerSecond * cfg.batteryLifeSpan
        } else {
          progress += cfg.batteryProgressPerSecond * timeSinceUsed
        }
      }
      
      if (progress >= cfg.completionProgressThreshold) {
        playerSnap.child('finished').ref.set(true)
        // Increment players finished counter and send final position to player
        return admin.database().ref('race/' + data.raceId + '/numPlayersFinished').once('value')
          .then((numFinishedSnap) => {
            const finalPosition = numFinishedSnap.val() + 1
            playerSnap.child('finalPosition').ref.set(finalPosition)
            numFinishedSnap.ref.set(finalPosition)
            
            admin.database().ref('user/' + ctx.auth.uid).once('value')
              .then((userSnap) => {
                // Add race to player's career
                careerSnap = userSnap.child('career')
                totalRaces = careerSnap.val().totalRaces + 1
                winsInPosition = (careerSnap.val().finishedRaces[finalPosition.toString()] || 0) + 1
  
                careerSnap.child('totalRaces').ref.set(totalRaces)
                careerSnap.child('finishedRaces/' + finalPosition).ref.set(winsInPosition)
                
                // Award player some arithmecoins
                const totalCoins = userSnap.child('account/arithmecoin').val() + cfg.positionWinnings[finalPosition]
                userSnap.child('account/arithmecoin').ref.set(totalCoins)
              })
            
            checkForEndOfRace(finalPosition, data.raceId)
            
            return { success: true, finalPosition, coinsAwarded: cfg.positionWinnings[finalPosition] }
          })
        
      }
      
      return { success: false }
      
    })
}

exports.exitRace = function(data, ctx) {
  admin.database().ref('user/' + ctx.auth.uid + '/assignedRace').remove()
  
  if (!data.raceId) {
    admin.database().ref('waitingroom/' + ctx.auth.uid).remove()
    return
  }

  admin.database().ref('race/' + data.raceId + '/player/' + ctx.auth.uid).remove()
}
