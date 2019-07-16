<template>
  <div id="canvas-container">
    <canvas width="700" height="500" ref="raceCanvas" />
  </div>
</template>

<script>
import * as PIXI from 'pixi.js'

export default {
  name: 'Race',
  components: {
  },
  data() {
    return {
      app: null
    }
  },
  methods: {
  },
  mounted() {
    fireAuth.signInAnonymously().then((user) => {
      user.updateProfile({
        displayName: 'testuser123'
      })
    }).catch((err) => {
      console.error(err.message)
    })
    
    this.app = new PIXI.Application({ width: 700, height: 500, view: this.$refs.raceCanvas, backgroundColor: 0xa3a5a8 })
    
  }
}
</script>

<style scoped>
#canvas-container {
    margin: auto;
    width: 700px;
}
</style>
