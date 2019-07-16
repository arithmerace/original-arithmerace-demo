<template>
  <div id="canvas-container">
    <b-button @click="initGame">Init Game</b-button>
    <canvas width="640" height="480" ref="raceCanvas" />
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
    initGame() {
      console.log(this.$refs)
      this.app = new PIXI.Application({ width: 640, height: 480, view: this.$refs.raceCanvas, backgroundColor: 0xa3a5a8 })
      
      const rect = new PIXI.Graphics()
      rect.beginFill(0x66CCFF)
      rect.drawRect(100, 100, 100, 100)
      rect.endFill()
      this.app.stage.addChild(rect)
    }
  },
  created() {
    
  }
    
}
</script>

<style scoped>
#canvas-container {
    margin: auto;
    width: 640px;
}
</style>
