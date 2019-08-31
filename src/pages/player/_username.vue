<template>
  <section class="section">
    <div class="container" width="80%">
      <br>
      <div class="columns">
        <div class="column has-text-centered">
          <h2 class="is-size-4 title">{{ profile.username }}'s Profile</h2>
          <p>${{ profile.account.arithmecoin }}<img src="~/assets/arithmecoin_small.png" class="ac-image" /></p>
        </div>
        <div class="column has-text-centered">
          <h2 class="is-size-4 title">{{ profile.username }}'s Career</h2>
          <p>{{ profile.career.totalRaces }} total races</p>
          <p>{{ profile.career.finishedRaces['1'] }} first place finishes</p>
          <p>{{ profile.career.finishedRaces['2'] }} second place finishes</p>
          <p>{{ profile.career.finishedRaces['3'] }} third place finishes</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { fireDb } from '~/plugins/firebase'

export default {
  name: 'UserProfile',
  data() {
    return {
      profile: null
    }
  },
  validate({ params }) {
    return fireDb().ref('usernames/' + params.username + '/uid').once('value')
      .then((uidSnap) => {
        return uidSnap.val()
      })
  },
  asyncData({ params }) {
    // Fetch user data before rendering component
    return fireDb().ref('usernames/' + params.username + '/uid').once('value')
      .then((uidSnap) => {
        return fireDb().ref('user/' + uidSnap.val()).once('value')
      })
      .then((userSnap) => {
        return { profile: userSnap.val() }
      })
  }
  
}
</script>

<style scoped>
.ac-image {
  vertical-align: middle;
}
.title {
  border-bottom: 1px solid gray;
  padding-bottom: 5px;
}
</style>
