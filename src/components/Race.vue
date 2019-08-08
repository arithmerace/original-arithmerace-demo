<template>
  <div>
    <div id="player-labels">
      <div
        class="speech-bubble"
        :class="{ 'bubble-default': playerid !== user.uid, 'bubble-player': playerid === user.uid  }"
        :style="'top: ' + player.sprite.y"
        v-for="(player, playerid) in game.players"
        :key="playerid" >
        <h1>
          {{ player.name }}
        </h1>
      </div>
    </div>
    <div id="game">
      <div id="canvas-div">
        <canvas :width="config.canvasWidth" :height="config.canvasHeight" ref="raceCanvas" />
      </div>
      <div id="ui" class="columns">
        <div class="columns column">
          <div class="column">
            <div class="ui-label">Batteries</div>
            <div
              class="ui-value"
              :class="{ 'fuel-full': game.numBatteries >= 4, 'fuel-medium': game.numBatteries >= 2 && game.numBatteries < 4, 'fuel-low': game.numBatteries < 2 }" >
              {{ game.numBatteries }}
            </div>
          </div>
        </div>
        <div class="column">
          <div class="ui-label">{{ game.questionLabel }}</div>
          <div class="ui-value">{{ game.questionValue }}</div>
        </div>
        <div class="column" @keyup.enter="handleSolution">
          <div class="ui-label">Your solution</div>
          <b-field :type="game.solutionFieldType">
            <b-input
              placeholder="Enter a number"
              v-model="game.userSolution"
              type="number"
              :disabled="game.solutionInputDisabled"
              ref="solutionInput"
            />
            <b-button :disabled="game.solutionInputDisabled" type="is-primary" @click="handleSolution">
              <b-icon icon="arrow-right" />
            </b-button>
          </b-field>
        </div>
        <div class="columns column">
          <div class="column">
            <div class="ui-label">Position</div>
            <div class="ui-value">{{ game.position }}</div>
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
import * as PIXI from 'pixi.js-legacy'
// const PIXI = require('pixi.js-legacy')
import { fireAuth, fireDb, fireFuncs } from '~/plugins/firebase'

// import PlayerLabel from '~/components/PlayerLabel.vue'

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
        forceCanvas: true
      },
      game: {
        started: false,
        position: '-',
        numBatteries: 0,
        questionValue: '',
        questionLabel: 'In waiting room',
        userSolution: '',
        solutionInputDisabled: true,
        solutionFieldType: null,
        players: {}
      }
    }
  },
  mounted() {
    fireAuth().onAuthStateChanged((user) => {
      if (user) {
        this.user = user
        this.joinWaitingRoom()
      } else {
        fireAuth().signInAnonymously()
          .then((user) => {
            this.user = user
            this.joinWaitingRoom()
          })
          .catch(err => this.$disp_error('signInAnon: ' + err, this))
      }
    })
  },
  beforeDestroy() {
    const raceId = (this.raceRef) ? this.raceRef.key : null
    this.submitExitRace({ raceId })
    
    // Destroy pixi application
    this.app.destroy(false, true)
  },
  methods: {
    submitSolution: fireFuncs().httpsCallable('submitProblemSolution'),
    submitFinish: fireFuncs().httpsCallable('submitFinish'),
    submitExitRace: fireFuncs().httpsCallable('exitRace'),
    joinWaitingRoom() {
      // Initialize Pixi window
      this.app = new PIXI.Application({
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        view: this.$refs.raceCanvas,
        backgroundColor: 0xa1a1a1,
        forceCanvas: this.config.forceCanvas
      })
      
      // Add user to waiting room
      const waitingRoomRef = fireDb().ref('waitingroom/' + this.user.uid)
      
      waitingRoomRef.set({
        waiting: true
      }).catch(err => this.$disp_error('waitingroomset:' + err, this))
      waitingRoomRef.onDisconnect().remove()
      
      // Update waiting room data
      const WRref = fireDb().ref('waitingroom')
      WRref.on('value', (snap) => {
        this.updateWaitingRoom(snap.val())
      })
      
      // When a race is assigned, initialize the game
      fireDb().ref('user/' + this.user.uid + '/assignedRace').on('value', (snap) => {
        if (snap.val() != null) {
          this.raceRef = fireDb().ref('race/' + snap.val())
          this.initRace()
        }
      })
    },
    initRace() {
      this.$toast.open('Race starting soon')
      document.title = 'RACE STARTING SOON'
      this.game.questionLabel = 'Problem:'
      this.game.questionValue = 'wait...'
      
      // Fetch player data
      this.raceRef.child('player').once('value', (snap) => {
        // Create player objects
        for (const [playerid, player] of Object.entries(snap.val())) {
          this.game.players[playerid] = {
            lane: player.lane,
            name: playerid,
            batteries: {},
            numBatteries: 0,
            progress: 0,
            finished: false,
            sprite: new PIXI.Graphics()
              .beginFill(0xd4a933)
              .drawRect(0, (player.lane - 1) * 80, 50, 50)
              .endFill()
          }
          
          // Add player sprite to stage
          this.app.stage.addChild(this.game.players[playerid].sprite)
        }
        
        // Start graphics loop (60 fps)
        this.app.ticker.add(delta => this.main(delta))

        // Start clock skew listener
        fireDb().ref('.info/serverTimeOffset').on('value', (snap) => {
          this.serverTimeOffset = snap.val()
        })
        
        // firstProblem will appear when race is started. Start race:
        this.raceRef.child('firstProblem').on('value', (snap) => {
          if (snap.val()) {
            document.title = 'Arithmerace'
            this.$toast.open('Race starting!')
            this.game.questionValue = snap.val()
            this.game.solutionInputDisabled = false
            this.$refs.solutionInput.focus()
            for (const playerid of Object.keys(this.game.players)) {
              // Start player update listener
              this.raceRef.child('player/' + playerid).on('value', snap => this.updatePlayer(snap, playerid))
            }
            this.game.started = true
          }
        })
      })
    },
    main(delta) {
      if (this.game.started) this.update()
      
      for (const player of Object.values(this.game.players)) {
        // Set each player's x position
        player.sprite.x = player.progress * ((this.config.canvasWidth - player.sprite.width) / 100)
      }
    },
    update() {
      for (const player of Object.values(this.game.players)) {
        if (!player.finished) {
          let progress = 0
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
          if (progress === 100) {
            this.submitFinish({ raceId: this.raceRef.key })
          }
          player.progress = progress
          player.numBatteries = numBatteries
        }
      }
      // Set this user's fuel and speed
      this.game.numBatteries = this.game.players[this.user.uid].numBatteries
    },
    updatePlayer(snap, playerid) {
      this.game.players[playerid].batteries = snap.val().batteries
      this.game.players[playerid].finished = snap.val().finished
      
      if (snap.val().finished) {
        this.game.players[playerid].progress = 100
      }
    },
    updateWaitingRoom(room) {
      if (room !== null) this.game.questionValue = Object.keys(room).length.toString() + ' player(s)'
      else this.game.questionValue = '0 players'
    },
    handleSolution() {
      this.game.solutionInputDisabled = true
      // Submit user's solution then process result:
      this.submitSolution({
        solution: this.game.userSolution,
        raceId: this.raceRef.key
      }).then((result) => {
        console.warn(`Client time is ${Date.now()}, server time is ${result.data.serverTime}, client time plus serverTimeOffset is ${Date.now() + this.serverTimeOffset}`)
        if (result.data.finished) {
          this.game.questionLabel = 'finished'
          this.game.questionValue = 'early'
          this.$toast.open('Good job, you finished all the problems!')
        } else if (result.data.correct) {
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
            this.game.solutionInputDisabled = false
            this.$refs.solutionInput.focus()
            this.game.solutionFieldType = null
          }, 500)
        }
      }).catch(err => this.$disp_error('submitSolution:' + err.message, this))
    }
  }
}
</script>

<style scoped>
#game {
  float: right;
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
  float: left;
  height: 450px;
}

.speech-bubble {
  position: absolute;
  border-radius: .4em;
  margin-right: 2px;
}

.bubble-default {
  background: #676088;
}

.bubble-player {
  background: #c7c400;
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
