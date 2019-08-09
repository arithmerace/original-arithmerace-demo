<template>
  <section class="section">
    <div class="container" width="50%">
      <form @submit.prevent>
        <!--<b-field label="Username">-->
        <!--  <b-input-->
        <!--    v-model="form.username"-->
        <!--    required-->
        <!--    minlength="4"-->
        <!--    maxlength="16"-->
        <!--    type="text"-->
        <!--    placeholder="Enter your username"-->
        <!--  />-->
        <!--</b-field>-->
        <b-field label="Email">
          <b-input v-model="form.email" required type="email" placeholder="Enter your email" />
        </b-field>
        <b-field label="Password">
          <b-input v-model="form.password" required type="password" placeholder="Enter your password" />
        </b-field>
        <b-button native-type="submit" :disabled="submitDisabled" type="is-primary" @click="login">Login</b-button>
      </form>
      <br />
      <p>Forgot your password? <a @click="resetPassword">Reset it.</a></p>
      <p>Don't have an account? <n-link to='/sign-up'>Create one.</n-link></p>
    </div>
  </section>
</template>

<script>
import { fireAuth } from '~/plugins/firebase'

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
    login() {
      this.submitDisabled = true
      fireAuth().signInWithEmailAndPassword(this.form.email, this.form.password).then((credential) => {
        this.$toast.open('Signed in successfully')
        this.$router.push('/')
      }).catch((err) => {
        if (err.code === 'auth/invalid-email') {
          this.$snackbar.open({
            duration: 30000,
            message: 'Uh oh, looks like that\'s not a valid email!'
          })
          this.form.email = ''
        } else if (err.code === 'auth/user-disabled') {
          this.$snackbar.open({
            duration: 30000,
            message: 'We\'re sorry, but your account has been disabled. Please visit the FAQ to learn why this may have happened.'
          })
          this.form.email = ''
          this.form.password = ''
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          this.$snackbar.open({
            duration: 30000,
            message: 'Wrong email or password, please try again.'
          })
          this.form.password = ''
        } else this.$disp_error('signInemailandpassword: ' + err, this)
        this.submitDisabled = false
      })
    },
    resetPassword() {
      // TODO reset password
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
