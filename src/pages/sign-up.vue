<template>
  <section class="section">
    <div class="container" width="50%">
      <form @submit.prevent>
        <b-field label="Username">
          <b-input
            v-model="form.username"
            required
            minlength="4"
            maxlength="16"
            type="text"
            placeholder="Pick a username"
          />
        </b-field>
        <b-field label="Email">
          <p>If you don't have your own email, ask a parent or guardian if you can use theirs.</p>
          <b-input v-model="form.email" required type="email" placeholder="Your email address" />
        </b-field>
        <b-field label="Password">
          <b-input v-model="form.password" required type="password" minlength="8" placeholder="Choose a password" />
        </b-field>
        <b-button native-type="submit" :disabled="submitDisabled" type="is-primary" @click="signup"></b-button>
      </form>
    </div>
  </section>
</template>

<script>
import { fireAuth, fireDb } from '~/plugins/firebase'

export default {
  name: 'SignUp',
  data() {
    return {
      submitDisabled: false,
      form: {
        username: '',
        email: '',
        password: ''
      }
    }
  },
  methods: {
    signup() {
      this.submitDisabled = true
      fireAuth().createUserWithEmailAndPassword(this.form.email, this.form.password).then((credential) => {
        fireDb().ref('user/' + credential.user.uid + '/profile').set({
          username: this.form.username
        }).then(() => {
          this.$toast.open('Your account was successfully created.')
          this.$router.push('/')
        }).catch(() => {
          
        })
      }).catch((err) => {
        if (err.code === 'auth/weak-password') {
          this.$snackbar.open({
            duration: 3000,
            message: 'Sorry, that password is too weak. Please make it stronger.'
            this.form.password = ''
          })
        } else if (err.code === 'auth/invalid-email') {
          this.$snackbar.open({
            duration: 3000,
            message: 'Please enter a valid email.'
            this.form.email = ''
          })
        } else this.$disp_error('signUpemailandpassword: ' + err, this)
        this.submitDisabled = false
      }})
    }
  }
}
</script>

<style scoped>
.container {
  text-align: center;
  width: 50%;
}
</style>
