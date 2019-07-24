<template>
  <div id="game">
    <div id="canvas-div">
      <canvas width="700" height="450" ref="raceCanvas" />
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
      <div class="column">
        <div class="ui-label">Your solution</div>
          <b-field :type="game.solutionFieldType">
            <b-input
              placeholder="Enter a number"
              v-model="game.userSolution"
              type="number"
              @keyup.enter="handleSolution"
              :disabled="game.solutionInputDisabled"
              ref="solutionInput"
            />
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
      game: {
        fuel: 40,
        speed: 0,
        position: '-',
        questionValue: '',
        questionLabel: 'In waiting room',
        userSolution: '',
        solutionInputDisabled: true,
        solutionFieldType: null
      }
    }
  },
  mounted() {
    // Sign In if needed, then init game
    this.user = fireAuth().currentUser
    if (this.user == null) {
      fireAuth().signInAnonymously()
        .then((user) => {
          this.user = user
          this.joinWaitingRoom()
        })
        .catch((err) => {
          this.$disp_error(err, this)
        })
    } else this.joinWaitingRoom()
  },
  methods: {
    joinWaitingRoom() {
      // Initialize Pixi window
      this.app = new PIXI.Application({ width: 700, height: 450, view: this.$refs.raceCanvas, backgroundColor: 0xa1a1a1, forceCanvas: true })
      
      // Add user to waiting room
      const waitingRoomRef = fireDb().ref('waitingroom/' + this.user.uid)
      
      waitingRoomRef.set({
        waiting: true
      }).catch((err) => { this.$disp_error('waitingroomset:' + err, this) })
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
      this.game.questionValue = '---'
      
      // firstProblem will appear when race is started. Start race:
      this.raceRef.child('firstProblem').on('value', (snap) => {
        if (snap.val()) {
          document.title = 'Arithmerace'
          this.$toast.open('Race starting!')
          this.game.questionValue = snap.val()
          this.game.solutionInputDisabled = false
          this.$refs.solutionInput.focus()
        }
      })
    },
    updateWaitingRoom(room) {
      if (room !== null) this.game.questionValue = Object.keys(room).length.toString() + ' player(s)'
      else this.game.questionValue = '0 players'
    },
    submitSolution: fireFuncs().httpsCallable('submitProblemSolution'),
    handleSolution() {
      this.$refs.game.solutionInput.blur()
      this.game.solutionInputDisabled = true
      // Submit user's solution then process result:
      this.submitSolution({ solution: this.game.userSolution }).then((result) => {
        
      }).catch(err => this.$disp_error('submitSolution:' + err.message))
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
