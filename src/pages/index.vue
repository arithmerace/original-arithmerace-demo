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
      This is an open beta published for the Congressional App Challenge. For information regarding the official release, please visit <a href="https://arithmerace.com">arithmerace.com</a>. If you would like to try it out, please <n-link to="/sign-up">sign up</n-link> (guest racing has been temporarily disabled).
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
        <li><p>There are several known issues with this site that I am working on fixing. If you see a gray error box pop up in the lower right, please ignore it - I am already aware of most of errors that occasionally occur.</p></li>
        <li><p>When doing races with other people, an error may appear and one or more people may lose the ability to enter answers to the questions. This is because of the quota limit on function calls with the free plan on the server I'm hosting this with. I apologize for this - once I have a final product ready, I will rent a proper server to remove this limitation.</p></li>
        <li><p>Have fun and thanks for trying out my project!</p></li>
        <!--<li><p>For further inquiries or feedback, please </p></li>-->
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
      fireDb().ref('/user/' + user.uid + '/username').once('value', (snap) => {
        this.username = snap.val()
      }).catch(err => this.disp_error('indexGetUName: ' + err, this))
    })
  },
  methods: {
  }
}
</script>
