<template>
  <div>
    <div id="game">
      <div id="player-labels">
        <div
          v-for="(player, playerid) in game.players"
          :key="playerid"
          class="speech-bubble"
          :class="{ 'bubble-default': playerid !== user.uid, 'bubble-player': playerid === user.uid }"
          :style="'top: ' + (player.lane - 1) * (config.trackHeight + config.stripeHeight) + 'px;'"
        >
          <h1>
            {{ player.name }}
            <span v-if="player.isBot" class="bot-label"> [bot]</span>
            <span v-if="player.isGuest" class="guest-label"> [guest]</span>
          </h1>
        </div>
      </div>
      <div id="canvas-div">
        <canvas ref="raceCanvas" :width="config.canvasWidth" :height="config.canvasHeight" />
      </div>
      <div id="ui" class="columns">
        <div class="columns column">
          <div class="column">
            <div class="ui-label">
              Batteries
            </div>
            <div
              class="ui-value"
              :class="{ 'fuel-full': game.numBatteries >= 4, 'fuel-medium': game.numBatteries >= 2 && game.numBatteries < 4, 'fuel-low': game.numBatteries < 2 }"
            >
              {{ game.numBatteries }}
            </div>
          </div>
        </div>
        <div class="column">
          <div class="ui-label">
            {{ game.questionLabel }}
          </div>
          <div class="ui-value">
            {{ game.questionValue }}
          </div>
        </div>
        <div class="column" @keyup.enter="handleSolution">
          <div class="ui-label">
            Your solution
          </div>
          <b-field :type="game.solutionFieldType">
            <b-input
              ref="solutionInput"
              v-model="game.userSolution"
              placeholder="Enter a number"
              type="number"
              :disabled="game.solutionInputDisabled"
            />
            <b-button :disabled="game.solutionInputDisabled" type="is-primary" @click="handleSolution">
              <b-icon icon="arrow-right" />
            </b-button>
          </b-field>
        </div>
        <div class="columns column">
          <div class="column">
            <div class="ui-label">
              Position
            </div>
            <div class="ui-value">
              {{ game.position }}
            </div>
          </div>
          <!--<div class="column">-->
          <!--  <div class="ui-label">Accuracy</div>-->
          <!--  <div class="ui-value">{{ game.position }}</div>-->
          <!--</div>-->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { fireAuth, fireDb, fireFuncs } from '~/plugins/firebase'
let PIXI = null
if (process.client) {
  PIXI = require('pixi.js-legacy')
}

export default {
  name: 'Race',
  components: {
    // PlayerLabel
  },
  data() {
    return {
      app: null,
      user: null,
      raceRef: null,
      serverTimeOffset: null,
      config: {
        // This part should match server config
        batteryLifeSpan: 5,
        batteryProgressPerSecond: 1,
        // Client-only config
        canvasHeight: 450,
        canvasWidth: 700,
        forceCanvas: true,
        canvasBackgroundColor: 0xffffff,
        numTracks: 5,
        trackHeight: 80,
        stripeWidth: 35, // canvasWidth should be a multiple of this
        stripeHeight: 5,
        stripeColor: 0xff0000,
        stripeMovementRate: 10,
        playerAnimationSpeed: 0.2 // Frames per application frame
      },
      waitingRoom: {
        waitingRoomUpdateInterval: null,
        waitingRoomText: null,
        waitingRoomTimeText: null,
        secondsToWait: 25
      },
      game: {
        running: false,
        finished: false,
        position: '-',
        numBatteries: 0,
        questionValue: '',
        questionLabel: 'In waiting room',
        userSolution: '',
        solutionInputDisabled: true,
        solutionFieldType: null,
        finishSubmitted: false,
        track: {
          stripes: []
        },
        players: {}
      }
    }
  },
  mounted() {
    // eslint-disable-next-line
    if (!process.client) return
    
    fireAuth().onAuthStateChanged((user) => {
      if (user) {
        this.user = user
        this.joinWaitingRoom()
      } else {
        this.$router.push('sign-up')
      }
    })
  },
  beforeDestroy() {
    const raceId = (this.raceRef) ? this.raceRef.key : null
    this.submitExitRace({ raceId })
    
    // Destroy pixi application
    if (this.app) this.app.destroy(false, true)
  },
  methods: {
    submitSolution: fireFuncs().httpsCallable('submitProblemSolution'),
    submitFinish: fireFuncs().httpsCallable('submitFinish'),
    submitExitRace: fireFuncs().httpsCallable('exitRace'),
    requestBotFill: fireFuncs().httpsCallable('botFill'),
    joinWaitingRoom() {
      // Initialize Pixi window
      this.app = new PIXI.Application({
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        view: this.$refs.raceCanvas,
        backgroundColor: this.config.canvasBackgroundColor,
        forceCanvas: this.config.forceCanvas
      })
      
      this.waitingRoom.waitingRoomText = new PIXI.Text('Joining Waiting Room')
      this.waitingRoom.waitingRoomText.position.set(200, 300)
      this.app.stage.addChild(this.waitingRoom.waitingRoomText)
      
      this.waitingRoom.waitingRoomTimeText = new PIXI.Text('Waiting...')
      this.waitingRoom.waitingRoomTimeText.position.set(175, 350)
      this.app.stage.addChild(this.waitingRoom.waitingRoomTimeText)
      
      // Add user to waiting room
      const waitingRoomRef = fireDb().ref('waitingroom/' + this.user.uid + '/waiting')
      
      waitingRoomRef.set(true).catch(err => this.$disp_error('waitingroomset:' + err, this))
      waitingRoomRef.onDisconnect().remove()
      
      // Update waiting room data
      const WRref = fireDb().ref('waitingroom')
      WRref.on('value', (snap) => {
        let text = '0 players'
        if (snap.val() !== null) text = Object.keys(snap.val()).length.toString() + ' player(s)'
        
        this.waitingRoom.waitingRoomText.text = text + ' in waiting room'
        this.game.questionValue = text
      })
      
      // Waiting room update loop
      this.waitingRoom.waitingRoomUpdateInterval = setInterval(() => {
        this.waitingRoom.secondsToWait -= 1
        if (this.waitingRoom.secondsToWait < 0) {
          this.waitingRoom.secondsToWait = 0
        }
        this.waitingRoom.waitingRoomTimeText.text = `Waiting for ${this.waitingRoom.secondsToWait} more seconds...`
      }, 1000)
      
      // When a race is assigned, initialize the game
      fireDb().ref('user/' + this.user.uid + '/assignedRace').on('value', (snap) => {
        if (snap.val() != null) {
          this.raceRef = fireDb().ref('race/' + snap.val())
          WRref.off()
          clearInterval(this.waitingRoom.waitingRoomUpdateInterval)
          this.initRace()
        }
      })
    },
    initRace() {
      this.$toast.open({ message: 'Race starting soon', queue: false })
      document.title = 'RACE STARTING SOON'
      this.game.questionLabel = 'Problem:'
      this.game.questionValue = 'wait...'
      
      // Fetch player data
      this.raceRef.child('player').once('value', (snap) => {
        this.waitingRoom.waitingRoomText.text = ''
        this.waitingRoom.waitingRoomTimeText.text = ''
        
        // Create player objects
        for (const [playerid, player] of Object.entries(snap.val())) {
          this.game.players[playerid] = {
            lane: player.lane,
            name: player.name,
            isGuest: player.isGuest,
            isBot: player.isBot,
            progressPerSecond: player.progressPerSecond,
            robot: player.robot,
            batteries: {},
            numBatteries: 0,
            progress: 0,
            finished: false
          }
          
          // Add player's robot to loader queue
          this.app.loader.add({
            url: '/robotassets/' + player.robot + '/spritesheet.json',
            name: 'robot' + playerid
          }, () => {
            // Callback called when player robot loaded
            const playerSpriteSheet = this.app.loader.resources['robot' + playerid].spritesheet
            const playerSprite = new PIXI.AnimatedSprite(playerSpriteSheet.animations[player.robot])
            playerSprite.animationSpeed = this.config.playerAnimationSpeed
            playerSprite.y = (player.lane - 1) * (this.config.trackHeight + this.config.stripeHeight)
            
            this.game.players[playerid].sprite = playerSprite
            this.app.stage.addChild(this.game.players[playerid].sprite)
          })
        }
        
        // Create race track stripes
        const numStripesPerTrack = this.config.canvasWidth / this.config.stripeWidth / 2
        for (let tracki = 1; tracki <= this.config.numTracks; tracki++) {
          for (let stripei = 0; stripei < numStripesPerTrack; stripei++) {
            const x = this.config.stripeWidth * 2 * stripei
            const y = (this.config.trackHeight + this.config.stripeHeight) * tracki - this.config.stripeHeight
            const stripe = new PIXI.Graphics()
              .beginFill(this.config.stripeColor)
              .drawRect(0, 0, this.config.stripeWidth, this.config.stripeHeight)
              .endFill()
              
            stripe.position.set(x, y)
            
            this.game.track.stripes.push(stripe)
            this.app.stage.addChild(this.game.track.stripes[this.game.track.stripes.length - 1])
          }
        }
        
        // Start loading of resources
        this.app.loader.load()
        
        // Start loop
        this.app.ticker.add(delta => this.main(delta))

        // Start clock skew listener
        fireDb().ref('.info/serverTimeOffset').on('value', (snap) => {
          this.serverTimeOffset = snap.val()
        })
        
        // firstProblem will appear when race is started. Start race:
        this.raceRef.child('firstProblem').on('value', (snap) => {
          if (snap.val()) {
            this.startRace(snap.val())
          }
        })
      })
    },
    startRace(firstProb) {
      document.title = 'Arithmerace'
      this.$toast.open({ message: 'Race starting!', queue: false })
      this.game.startTime = Date.now()
      this.game.questionValue = firstProb
      this.game.solutionInputDisabled = false
      this.$refs.solutionInput.focus()
      for (const [playerid, player] of Object.entries(this.game.players)) {
        // Start player update listener
        this.raceRef.child('player/' + playerid).on('value', snap => this.updatePlayer(snap, playerid))
        
        // Start player animation
        player.sprite.play()
      }
      this.game.running = true
    },
    main(delta) {
      if (this.game.running) {
        this.update()
        
        // Update stripe positions
        for (const stripe of this.game.track.stripes) {
          stripe.x -= this.config.stripeMovementRate + delta
          // Move stripe back to right side of canvas if it has exited the left.
          if (stripe.x <= -this.config.stripeWidth) {
            stripe.x = this.config.canvasWidth - (-this.config.stripeWidth - stripe.x)
          }
        }
        
        // Update player positions
        for (const player of Object.values(this.game.players)) {
          // Set each player's x position
          if (player.sprite) player.sprite.x = Math.floor(player.progress * ((this.config.canvasWidth - player.sprite.width) / 100))
        }
      }
    },
    update() {
      // Update player data
      for (const player of Object.values(this.game.players)) {
        let progress = 0
        if (player.isBot) {
          progress = (Date.now() - this.game.startTime) / 1000 * player.progressPerSecond
        } else if (!player.finished) {
          let numBatteries = 0
          for (const battery of Object.values(player.batteries)) {
            const timeSinceUsed = ((Date.now() + this.serverTimeOffset) - battery.used) / 1000
            if (timeSinceUsed > this.config.batteryLifeSpan) {
              progress += this.config.batteryProgressPerSecond * this.config.batteryLifeSpan
            } else {
              progress += this.config.batteryProgressPerSecond * timeSinceUsed
              numBatteries += 1
            }
          }
          player.numBatteries = numBatteries
        }
        player.progress = progress
      }
      
      // Find position for each player
      const playerPositionArray = Object.entries(this.game.players).sort((a, b) => {
        return b[1].progress - a[1].progress // Sort from greatest progress to least
      })
      const playerPositions = {}
      for (const [position, playerEntry] of Object.entries(playerPositionArray)) {
        playerPositions[playerEntry[0]] = parseInt(position) + 1 // Top should be 1, not zero.
      }
      
      // Set this user's number of batteries, increase by one for asthetic reasons
      this.game.numBatteries = this.game.players[this.user.uid].numBatteries + 1
      // Set this user's position
      this.game.position = this.$with_ordinal_suffix(playerPositions[this.user.uid])
      // Submit finish
      if (this.game.players[this.user.uid].progress >= 100) this.handleFinishRace()
    },
    updatePlayer(snap, playerid) {
      // update player data from database
      this.game.players[playerid].batteries = snap.val().batteries
      this.game.players[playerid].finished = snap.val().finished
      
      if (snap.val().finished) {
        this.game.players[playerid].progress = 100
      }
    },
    handleSolution() {
      this.game.solutionInputDisabled = true
      // Submit user's solution then process result:
      this.submitSolution({
        solution: this.game.userSolution,
        raceId: this.raceRef.key
      }).then((result) => {
        if (result.data.correct) {
          this.game.questionValue = result.data.nextProblem
          this.game.solutionFieldType = 'is-success'
          setTimeout(() => {
            this.game.userSolution = ''
            this.game.solutionInputDisabled = false
            this.$refs.solutionInput.focus()
            this.game.solutionFieldType = null
          }, 500)
        } else {
          // Solution was not correct, display "try again" messages and re-enable input
          this.game.solutionFieldType = 'is-danger'
          this.$toast.open({
            type: 'is-danger',
            message: 'Try again!',
            duration: 1000,
            position: 'is-bottom-right',
            queue: false
          })
          setTimeout(() => {
            this.game.userSolution = ''
            this.game.solutionInputDisabled = false
            this.$refs.solutionInput.focus()
            this.game.solutionFieldType = null
          }, 500)
        }
      }).catch(err => this.$disp_error('submitSolution:' + err.message, this))
    },
    handleFinishRace() {
      if (!this.game.finishSubmitted) {
        this.submitFinish({ raceId: this.raceRef.key }).then((result) => {
          if (result.data.success) {
            this.$toast.open({
              message: `You finished the race ${this.$with_ordinal_suffix(result.data.finalPosition)} and earned ${result.data.coinsAwarded} Arithmecoins.`,
              duration: 5000,
              type: 'is-success'
            })
            this.game.players[this.user.uid].finished = true
            this.game.solutionInputDisabled = true
            this.game.questionLabel = 'Finished'
            this.game.questionValue = this.$with_ordinal_suffix(result.data.finalPosition)
            this.game.finished = true
            
            for (const player of Object.values(this.game.players)) {
              player.sprite.stop()
            }
          } else {
            this.$toast.open('ERROR: due to an internal error, you were unable to finish the race.')
          }
        }).catch(err => this.$disp_error('You were unable to finish the race, due to an error: submitFinish: ' + err, this))
        this.game.finishSubmitted = true
        this.game.running = false
      }
    }
  }
}
</script>

<style scoped>
#game {
  padding: 10px;
  width: 720px;
  margin: auto;
  border: 1px solid gray;
  border-radius: 4px;
}

/* UI */
#ui {
  height: 100px;
  width: 700px;
}
.ui-value {
  font-size: 2em;
  text-align: center;
}
.ui-label {
  text-align: center;
  color: gray;
}
.fuel-full {
  color: green;
}
.fuel-medium {
  color: orange;
}
.fuel-low {
  color: red;
}

/* Player labels */
/* Bubble design by https://leaverou.github.io/bubbly/ */

#player-labels {
  position: relative;
  float: left;
  height: 450px;
  background-color: green;
}

.speech-bubble {
  position: absolute;
  right: 5px; /* position right side of bubble in div, which is floated to left side of game */
  border-radius: .4em;
  margin-right: 2px;
}

.bubble-default {
  background: #676088;
}

.bubble-player { /* Coloring for client player's label */
  background: #c7c400;
}

.bot-label {
  color: #FF0000;
}

.guest-label {
  color: #00FF00;
}

.speech-bubble h1 {
  color: white;
  margin: 5px;
}

.speech-bubble:after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 0;
  height: 0;
  border: 5px solid transparent;
  border-left-color: #676088;
  border-right: 0;
  margin-top: -5px;
  margin-right: -5px;
}
</style>
