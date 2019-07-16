<template>
  <section class="section">
    1.
    <b-button type="is-success" @click="guestLogin">Login as Guest</b-button>
    2.
    <b-button type="is-primary" tag="n-link" to="/race">Race</b-button>
  </section>
</template>

<script>
import { fireAuth } from '@/plugins/firebase'

export default {
  name: 'HomePage',
  data() {
    return {
    }
  },
  methods: {
    guestLogin() {
      fireAuth.signInAnonymously().then((user) => {
        user.updateProfile({
          displayName: 'testuser123'
        })
      }).catch((err) => {
        console.error(err.message)
      })
    }
  }
}
</script>
