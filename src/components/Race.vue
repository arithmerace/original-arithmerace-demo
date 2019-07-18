<template>
  <div id="canvas-container">
    <canvas width="700" height="500" ref="raceCanvas" />
  </div>
</template>

<script>
import * as PIXI from 'pixi.js'
import { fireAuth, fireDb } from '~/plugins/firebase'

export default {
  name: 'Race',
  components: {
  },
  data() {
    return {
      app: null,
      user: null,
      waitingRoom: {}
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
      this.app = new PIXI.Application({ width: 700, height: 500, view: this.$refs.raceCanvas, backgroundColor: 0xa3a5a8 })
      
      // Add user to waiting room
      fireDb().ref('waitingroom/' + this.user.uid).set({
        waiting: true
      }).catch((err) => { this.$disp_error('waitingroom:' + err, this) })
      
      // Update waiting room data
      fireDb().ref('waitingroom').on('value', (snap) => {
        this.updateWaitingRoom(snap.val())
      })
      
      fireDb().ref('user/' + this.user.uid).on('value', (snap) => {
        if (snap.val().assignedRace !== null) {
          this.startRace(snap.val().assignedRace)
        }
      })
    },
    startRace(race) {
      alert('The game is starting!!!')
    },
    updateWaitingRoom(room) {
      
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
