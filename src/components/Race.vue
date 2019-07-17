<template>
  <div id="canvas-container">
    <canvas width="700" height="500" ref="raceCanvas" />
  </div>
</template>

<script>
import * as PIXI from 'pixi.js'
import { fireAuth } from '~/plugins/firebase'

export default {
  name: 'Race',
  components: {
  },
  data() {
    return {
      app: null,
      user: null
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
      this.app = new PIXI.Application({ width: 700, height: 500, view: this.$refs.raceCanvas, backgroundColor: 0xa3a5a8 })
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
