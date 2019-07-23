<template>
  <div id="game">
    <div id="canvas-div">
      <canvas width="700" height="450" ref="raceCanvas" />
    </div>
    <div id="ui">
    </div>
  </div>
</template>

<script>
import * as PIXI from 'pixi.js-legacy'
import { fireAuth, fireDb } from '~/plugins/firebase'

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
        waitingRoomText: new PIXI.Text('Heading to waiting room...')
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
          this.initGame()
        })
        .catch((err) => {
          this.$disp_error(err, this)
        })
    } else this.initGame()
  },
  methods: {
    initGame() {
      // Initialize Pixi window
      this.app = new PIXI.Application({ width: 700, height: 450, view: this.$refs.raceCanvas, backgroundColor: 0xa1a1a1, forceCanvas: true })
      this.app.stage.addChild(this.game.waitingRoomText)
      
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
      
      fireDb().ref('user/' + this.user.uid + '/assignedRace').on('value', (snap) => {
        if (snap.val() != null) {
          this.raceRef = fireDb().ref('race/' + snap.val())
          this.startRace()
        }
      })
    },
    startRace() {
      this.$toast.open('Race starting soon')
      document.title = 'RACE STARTING SOON'
      
      this.raceRef.child('started').on('value', (snap) => {
        if (snap.val()) {
          document.title = 'Arithmerace - in race'
          this.$toast.open('Race starting!')
        }
      })
    },
    updateWaitingRoom(room) {
      if (room !== null) this.game.waitingRoomText.text = Object.keys(room).length.toString() + ' player(s) in waiting room'
      else this.game.waitingRoomText.text = 'Waiting room empty'
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
  background-color: green;
  width: 700px;
}
</style>
