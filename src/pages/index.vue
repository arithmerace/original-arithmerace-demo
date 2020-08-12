<template>
  <section class="container has-text-centered">
    <h1 class="is-size-2">
      Welcome to Arithmerace!
    </h1>
    <h3 class="is-size-4">
      <em>A multiplayer competitive online math racing game.</em>
    </h3>
    <br>
    <p>Arithmerace is a multiplayer online competitive math robot-racing game developed by a high schooler in Colorado.</p><br>
    <p v-if="!user || user == null">
      This is an original prototype published for the Congressional App Challenge. For information regarding the official release, please visit <a href="https://arithmerace.com">arithmerace.com</a>. If you would like to try it out, please <n-link to="/sign-up">sign up</n-link> (guest racing has been temporarily disabled).
    </p>
    <div v-else>
      <br>
      <p>Hello there, {{ username }}.</p>
    </div>
    <br></br>
    <div v-if="user">
      <h2 class="is-size-4">
        More info
      </h2>
      <p><strong>Please read:</strong></p>
      <ol>
        <li><p>This is an original prototype published for the Congressional App Challenge. For information regarding the official release, please visit <a href="https://arithmerace.com">arithmerace.com</a></p></li>
        <li><p>To avoid any unexpected costs, I have the quotas for processing set very low on my servers. They should be high enough for normal use but if you run into an issue where a race stops working halfway through, this is probably why. </p></li>
        <li><p>Feel free to contact me (link at bottom of page) with any issues or comments.</p></li>
        <li><p>Have fun and thanks for trying out my project!</p></li>
      </ol>
    </div>
  </section>
</template>

<script>
import WelcomeModal from '~/components/WelcomeModal'
import { fireDb, fireAuth } from '~/plugins/firebase'

export default {
  name: 'HomePage',
  data() {
    return {
      user: null,
      username: null
    }
  },
  mounted() {
    // Check for new user argument
    if (this.$route.query.welcome) {
      this.$modal.open({
        parent: this,
        component: WelcomeModal,
        hasModalCard: true,
        canCancel: [],
        scroll: 'clip',
        trapFocus: true,
        ariaModal: true
      })
    }
    
    fireAuth().onAuthStateChanged((user) => {
      this.user = user
      if (!user) return
      fireDb().ref('/user/' + user.uid + '/username').once('value', (snap) => {
        this.username = snap.val()
      }).catch(err => this.disp_error('indexGetUName: ' + err, this))
    })
  },
  methods: {
  }
}
</script>
