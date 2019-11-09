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

function botFill() {
  admin.database().ref('/waitingroom').once('value')
    .then((snap) => {
      // Create the right amount of bots
      
      const numRealPlayers = Object.keys(snap.val()).length
      
      const botsToCreate = cfg.playersToStartRace - numRealPlayers
      
      for (i=0; i<botsToCreate; i++) {
        snap.ref.push({ waiting: true, isBot: true })
      }
    })
}

exports.convertWRtoGame = function(playerSnap, ctx) {
  playerSnap.ref.parent.once('value', (wrsnap, ctx) => {
    if (wrsnap.numChildren() === cfg.playersToStartRace) {
      // Create new game ref
      const raceRef = admin.database().ref('race').push()
      
      let lane = 0
      wrsnap.forEach((player) => {
        // For each player in waiting room, add player data to race then remove player from waiting room
        admin.database().ref('user/' + player.key).once('value')
          .then((userSnap) => {
            lane ++
            if (player.child('isBot').val()) {
              raceRef.child('player').push({
                name: cfg.bot_names[Math.floor(Math.random()*cfg.bot_names.length)],
                robot: cfg.bot_robots[Math.floor(Math.random()*cfg.bot_robots.length)],
                batteries: {},
                finished: false,
                finalPosition: null,
                lane,
                isBot: true,
                progressPerSecond: cfg.botMinProgressPerSecond + (Math.random() * (cfg.botMaxProgressPerSecond - cfg.botMinProgressPerSecond + 1))
              })
            } else {
              raceRef.child('player/' + player.key).set({
                name: (userSnap.val()) ? userSnap.val().username : 'Guest',
                isGuest: (!userSnap.val()),
                robot: (userSnap.val()) ? userSnap.val().robot : 'guest_bot',
                batteries: {},
                finished: false,
                finalPosition: null,
                startTime: null,
                currentProblem: 0,
                lane
              })
          
            
              userSnap.child('assignedRace').ref.set(raceRef.key)
            }
            player.ref.remove()
        })
      })
      // Generate math problems
      const problems = [generateNewProblem()]
      // the '_race' ref is used for hidden race data
      admin.database().ref('_race/' + raceRef.key).child('problems').set(problems)
      setTimeout(() => {
        raceRef.child('player').once('value', (playersSnap) => {
          playersSnap.forEach((player) => {
            // Give player 1 battery to start with; set start time
            player.child('batteries').ref.push({ used: Date.now() })
            player.ref.child('startTime').set(Date.now())
          })
          raceRef.child('firstProblem').set(problems[0].question)
        })
      }, cfg.raceStartDelay)
    } else if (wrsnap.numChildren() < cfg.playersToStartRace) {
      // Start delay for bot filling, but make sure this player isn't a bot
      if (playerSnap.child('isBot').val()) return
      setTimeout(() => {
        playerSnap.ref.parent.once('value')
          .then((wrsnap) => {
            if (wrsnap.val() && playerSnap.key in wrsnap.val()) {
              // Player still in waiting room, add bots
              botFill()
            }
          })
      }, cfg.botFillWaitTime)
    } else {
      if (playerSnap.child('isBot').val())
      playerSnap.ref.remove()
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
      
      // Check for bot finishes first
      // numBotFinishes stores the number of bots that have finished since last submitFinish
      let numBotFinishes = 0
      const numPlayersFinishedRef = admin.database().ref('race/' + data.raceId + '/numPlayersFinished')
      return playerSnap.ref.parent.once('value')
        .then((playersSnap) => {
          playersSnap.forEach((player) => {
            if (player.child('isBot').val() && !player.child('finished').val()) {
              // Use current race length to see if bot has finished
              const currentRaceLength = (Date.now() - player.child('startTime').val()) / 1000
              if (currentRaceLength * player.child('progressPerSecond').val() >= 100) {
                numBotFinishes ++
                player.child('finished').ref.set(true)
              }
            }
          })
          
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
            return numPlayersFinishedRef.once('value')
              .then((numFinishedSnap) => {
                const finalPosition = numFinishedSnap.val() + 1 + numBotFinishes
                playerSnap.child('finalPosition').ref.set(finalPosition)
                numPlayersFinishedRef.set(finalPosition)
                
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
