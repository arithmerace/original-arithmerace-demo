<template>
  <div id="canvas-container">
    <canvas width="700" height="500" ref="raceCanvas" />
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
      this.app = new PIXI.Application({ width: 700, height: 500, view: this.$refs.raceCanvas, backgroundColor: 0xa1a1a1, forceCanvas: true })
      this.app.stage.addChild(this.game.waitingRoomText)
      
      // Add user to waiting room
      const waitingRoomRef = fireDb().ref('waitingroom/' + this.user.uid)
      
      waitingRoomRef.set({
        waiting: true
      }).catch((err) => { this.$disp_error('waitingroomset:' + err, this) })
      waitingRoomRef.onDisconnect().remove()
      
      // Update waiting room data
      fireDb().ref('waitingroom').on('value', (snap) => {
        console.log('hey?')
        this.updateWaitingRoom(snap.val())
      })
      
      fireDb().ref('user/' + this.user.uid + '/assignedRace').on('value', (snap) => {
        if (snap.val() != null) {
          this.startRace(snap.val().assignedRace)
        }
      })
    },
    startRace(race) {
      
    },
    updateWaitingRoom(room) {
      this.game.waitingRoomText.text = Object.keys(room).length.toString() + ' player(s) in waiting room'
    }
  }
}
</script>

<style scoped>
#canvas-container {
    margin: auto;
    width: 700px;
}
</style>
