<template>
  <div id="game">
    <div id="canvas-div">
      <canvas :width="config.canvasWidth" :height="config.canvasHeight" ref="raceCanvas" />
    </div>
    <div id="ui" class="columns">
      <div class="columns column">
        <div class="column">
          <div class="ui-label">Fuel</div>
          <div
            class="ui-value"
            :class="{ 'fuel-full': game.fuel >= 60, 'fuel-medium': game.fuel >= 30 && game.fuel < 60, 'fuel-low': game.fuel < 30 }" >
            {{ game.fuel }}%
          </div>
        </div>
        <div class="column">
          <div class="ui-label">Speed</div>
          <div class="ui-value" >{{ game.speed }}</div>
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
</template>

<script>
import * as PIXI from 'pixi.js-legacy'
// const PIXI = require('pixi.js-legacy')
import { fireAuth, fireDb, fireFuncs } from '~/plugins/firebase'

export default {
  name: 'Race',
  components: {
  },
  data() {
    return {
      app: null,
      user: null,
      raceRef: null,
      config: {
        movementRate: 0.1,
        fuelConsumedPerSecond: 3,
        fuelSpeedInterval: 20, // amount of fuel needed to get to next speed level
        canvasHeight: 450,
        canvasWidth: 700,
        forceCanvas: true
      },
      game: {
        started: false,
        fuel: 0,
        fuelTimestamp: 0,
        speed: 0,
        position: '-',
        questionValue: '',
        questionLabel: 'In waiting room',
        userSolution: '',
        solutionInputDisabled: true,
        solutionFieldType: null,
        players: {}
      }
    }
  },
  computed: {
    speedwatch() {
      return this.game.speed
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
    const raceId = this.raceRef.key || null
    this.submitExitRace({ raceId })
    
    // Destroy pixi application
    this.app.destroy(false, true)
  },
  methods: {
    submitSolution: fireFuncs().httpsCallable('submitProblemSolution'),
    submitSpeedUpdate: fireFuncs().httpsCallable('submitSpeedUpdate'),
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
            fuel: {
              is: 0,
              was: 0
            },
            speed: {
              is: 0,
              was: 0,
              at: 0 // Speed was speed.was at speed.at timestamp
            },
            progress: {
              is: 0,
              was: 0
            },
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
        
        // firstProblem will appear when race is started. Start race:
        this.raceRef.child('firstProblem').on('value', (snap) => {
          if (snap.val()) {
            document.title = 'Arithmerace'
            this.$toast.open('Race starting!')
            this.game.questionValue = snap.val()
            this.game.solutionInputDisabled = false
            this.$refs.solutionInput.focus()
            this.game.fuel = 20
            
            // Start player update listener
            this.raceRef.child('player').on('value', snap => this.updatePlayers(snap))
            
            this.game.started = true
          }
        })
      })
    },
    main(delta) {
      if (this.game.started) this.update()
      
      for (const player of Object.values(this.game.players)) {
        // Set each player's x position
        player.sprite.x = player.progress * (this.config.canvasWidth / 100)
      }
    },
    update() {
      const timeSinceLastFuelUpdate = (Date.now() - this.game.fuelTimestamp) / 1000
      for (const player of Object.values(this.game.players)) {
        // Subtract (fuel consumption rate * seconds since last fuel value) from last fuel value, then round and clamp to 0-100
        player.fuel.is = Math.max(Math.min(Math.round(player.fuel.was - timeSinceLastFuelUpdate * this.config.fuelConsumedPerSecond), 100), 0)
        
        // Calculate player's speed based on fuel
        player.speed.is = Math.floor((player.fuel.is - 1) / this.config.fuelSpeedInterval) + 1
        
        if (player.speed.is !== player.speed.was) {
          player.speed.at = Date.now()
          player.speed.was = player.speed.is
          player.progress.was = player.progress.is
        }
        
        const timeSinceLastSpeedChange = (Date.now() - player.speed.at) / 1000
        
        // Calculate player's progress based on speed
        player.progress.is = player.progress.was + (timeSinceLastSpeedChange * this.config.movementRate * player.speed.is)
      }
      // Set this user's fuel and speed
      this.game.fuel = this.game.players[this.user.uid].fuel.is
      this.game.speed = this.game.players[this.user.uid].speed.is
    },
    updatePlayers(snap) {
      this.game.fuelTimestamp = Date.now()
      
      for (const [playerid, player] of Object.entries(snap.val())) {
        this.game.players[playerid].fuel.was = player.fuel
        // TODO update progress and speed
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
        if (result.data.finished) {
          this.game.questionValue = 'early'
          this.game.questionLabel = 'finished'
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
  },
  watch: {
    speedwatch() {
      // Request server update every time this player's speed level changes, to ensure that clients are updated.
      this.submitSpeedUpdate({ raceId: this.raceRef.key }).catch(err => this.$disp_error('submitSpeedUpdate:' + err.message, this))
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
</style>
