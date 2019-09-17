<template>
  <section class="container has-text-centered">
    <h1 class="is-size-2">
      My Inventory
    </h1>
    <h2 class="is-size-4">Robots</h2>
    <div class="columns">
      <div class="column" v-for="column in [0, 1, 2, 3]" :key="column">
        <template v-for="(robot, rid) in robotList.robots">
          <Card v-if="(robot.id - column) % 4 === 0" :key="rid" :title="robot.name">
            <img :src="'/robotassets/' + rid + '/thumbnail.png'" :alt="rid" />
            <template slot="footer">
              <n-link  v-if="loggedOut" to='/login' class="card-footer-item">
                {{ robot.price }} <img src="~/assets/arithmecoin_small.png" class="ac-image" alt="arithmecoin" /> - (Sign in)
              </n-link>
              <span v-else-if="equippedBot === rid" class="card-footer-item">Equipped</span>
              <a v-else-if="userRobots[rid] && userRobots[rid].owned" class="card-footer-item" @click="() => handleEquip(rid)">Equip</a>
              <span v-else-if="robot.price > userArithmecoin" class="card-footer-item">{{ robot.price }} <img src="~/assets/arithmecoin_small.png" class="ac-image" alt="arithmecoin" /> - Too expensive</span>
              <a v-else class="card-footer-item" @click="() => handlePurchase(rid)">{{ robot.price }} <img src="~/assets/arithmecoin_small.png" class="ac-image" alt="arithmecoin" /> - Buy</a>
            </template>
          </Card>
        </template>
      </div>
    </div>
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
    purchaseRobot: fireFuncs().httpsCallable('purchaseRobot'),
    equipRobot: fireFuncs().httpsCallable('equipRobot'),
    handlePurchase(robotId) {
      this.$dialog.confirm({
        title: 'Confirm',
        message: `Are you sure you want to buy the <strong>${this.robotList.robots[robotId].name}</strong> for ${this.robotList.robots[robotId].price} Arithmecoins?`,
        cancelText: 'Cancel',
        confirmText: 'Ok',
        type: 'is-success',
        onConfirm: () => {
          this.purchaseRobot({ robot: robotId })
            .then((result) => {
              if (result.data.success) {
                this.$toast.open('Robot purchased successfully!')
                this.$router.push('/inventory')
              } else this.$disp_error('purchaseRobot Error', this)
            }).catch(err => this.$disp_error('purchaseRobot: ' + err, this))
        }
      })
    },
    handleEquip(robotId) {
      this.equipRobot({ robot: robotId })
        .then((result) => {
          if (result.data.success) {
            this.$toast.open('Robot equipped')
            this.$router.push('/inventory')
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
