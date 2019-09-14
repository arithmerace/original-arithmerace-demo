<template>
  <section class="container has-text-centered">
    <h1 class="is-size-2">
      Robot Shop
    </h1>
    <p>Here you can buy robots using your Arithmecoins (<img src="~/assets/arithmecoin_small.png" class="ac-image" />). Need more Arithmecoin? You can earn some by getting first, second, or third place in <n-link to='/race'>a race</n-link>. Or you can <n-link to='/buy'>buy some</n-link> if you're really that impatient.</p>
    <div class="columns">
      <div class="column">
        First column
      </div>
      <div class="column">
        Second column
      </div>
      <div class="column">
        Third column
      </div>
      <div class="column">
        Fourth column
      </div>
    </div>
    <Card title="Robot">
      Robo.
      <template slot="footer">
        <a href="#" class="card-footer-item is-success">Buy</a>
        <a href="#" class="card-footer-item">Equip</a>
      </template>
    </Card>
  </section>
</template>

<script>
import { fireFuncs } from '~/plugins/firebase'
import * as robotList from '~/static/robotList.json'
import Card from '~/components/Card.vue'

export default {
  name: 'Shop',
  components: {
    Card
  },
  data() {
    return {
      robotList
    }
  },
  methods: {
    purchaseRobot: fireFuncs().httpsCallable('purchaseRobot'),
    equipRobot: fireFuncs().httpsCallable('equipRobot'),
    handlePurchase(robotId) {
      
    }
  }
}
</script>

<style scoped>
.ac-image {
  vertical-align: middle;
}
</style>
