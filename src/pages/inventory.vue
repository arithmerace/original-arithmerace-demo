<template>
  <section class="container has-text-centered">
    <h1 class="is-size-2">
      My Inventory
    </h1>
    <h2 class="is-size-4">Robots</h2>
    <div v-if="!loggedOut" class="columns">
      <div class="column" v-for="column in [0, 1, 2, 3]" :key="column">
        <template v-for="(robot, rid) in robotList.robots">
          <Card v-if="(robot.id - column) % 4 === 0 && userRobots[rid] && userRobots[rid].owned" :key="rid" :title="robot.name">
            <img :src="'/robotassets/' + rid + '/thumbnail.png'" :alt="rid" />
            <template slot="footer">
              <span v-if="equippedBot === rid" class="card-footer-item">Equipped</span>
              <a v-else class="card-footer-item" @click="() => handleEquip(rid)">Equip</a>
            </template>
          </Card>
        </template>
      </div>
    </div>
    <p>You don't have any more robots! Want to go buy another from <n-link to="/shop">the store?</n-link></p>
  </section>
</template>
<script>
import { fireFuncs, fireDb, fireAuth } from '~/plugins/firebase'
import robotList from '~/assets/robotList.js'
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
  asyncData() {
    if (!fireAuth().currentUser) return { loggedOut: true }
    return fireDb().ref('user/' + fireAuth().currentUser.uid).once('value')
      .then((snap) => {
        if (!snap.val()) return { loggedOut: true }
        return {
          equippedBot: snap.val().robot,
          userRobots: snap.val().account.robots,
          userArithmecoin: snap.val().account.arithmecoin
        }
      })
  },
  methods: {
    equipRobot: fireFuncs().httpsCallable('equipRobot'),
    handleEquip(robotId) {
      this.equipRobot({ robot: robotId })
        .then((result) => {
          if (result.data.success) {
            this.$toast.open({
              message: 'Robot equipped.',
              queue: false
            })
            // window.location.reload(true)
          } else this.$disp_error('purchaseRobot Error', this)
        }).catch(err => this.$disp_error('purchaseRobot: ' + err, this))
    }
  }
}
</script>

<style scoped>
.ac-image {
  vertical-align: middle;
}
</style>
