<template>
  <section class="section">
    <div class="container" width="50%">
      <h1 class="is-size-3">
        Sign Up
      </h1>
      <p>Before racing, please create an account.</p>
      <br>
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
          <b-input v-model="form.email" required type="email" placeholder="Your email address" />
        </b-field>
        <b-field label="Password">
          <b-input v-model="form.password" required type="password" minlength="6" placeholder="Choose a password" />
        </b-field>
        <b-field>
          <b-checkbox v-model="form.agree">
            I agree to the
            <a href="/site/terms-and-privacy" target="_blank">
              terms and privacy policy
            </a>
            .
          </b-checkbox>
        </b-field>
        <b-button native-type="submit" :disabled="submitDisabled" type="is-primary" @click="signup">
          Create account
        </b-button>
      </form>
      <br>
      <p>
        Already have an account? <n-link to="/login">
          Login.
        </n-link>
      </p>
    </div>
  </section>
</template>

<script>
import { fireAuth, fireFuncs } from '~/plugins/firebase'

export default {
  name: 'SignUp',
  data() {
    return {
      submitDisabled: false,
      form: {
        username: '',
        email: '',
        password: '',
        agree: false
      }
    }
  },
  methods: {
    createUserFunc: fireFuncs().httpsCallable('createNewUser'),
    signup() {
      if (!this.form.agree) {
        this.$toast.open({
          duration: 6000,
          message: 'You must agree to the terms and privacy in order to create an account',
          queue: false
        })
        return
      }
      
      this.submitDisabled = true
      fireAuth().createUserWithEmailAndPassword(this.form.email, this.form.password).then((credential) => {
        this.createUserFunc({
          username: this.form.username
        }).then((result) => {
          if (result.data.error === 'username-taken') {
            this.$toast.open({
              duration: 6000,
              message: 'That username is already taken',
              queue: false
            })
            fireAuth().signOut()
          } else if (result.data.error === 'username-invalid') {
            this.$toast.open({
              duration: 6000,
              message: 'That username is invalid. It must be all-lowercase, numbers and letters only, 4-18 characters long.',
              queue: false
            })
            fireAuth().signOut()
          } else if (result.data.success) {
            this.$toast.open('Your account was successfully created.')
            window.location.replace('/?welcome=true')
          }
          this.submitDisabled = false
        }).catch((err) => {
          this.$disp_error('createUserFunc: ' + err, this)
          this.submitDisabled = false
        })
      }).catch((err) => {
        if (err.code === 'auth/weak-password') {
          this.$snackbar.open({
            duration: 30000,
            message: 'Sorry, that password is too weak. It must be longer than 6 characters.'
          })
          this.form.password = ''
        } else if (err.code === 'auth/invalid-email') {
          this.$snackbar.open({
            duration: 30000,
            message: 'Please enter a valid email.'
          })
          this.form.email = ''
        } else if (err.code === 'auth/email-already-in-use') {
          this.$snackbar.open({
            duration: 30000,
            message: 'An account was already created with that email. Please visit the FAQ for more info.'
          })
        } else this.$disp_error('signUpemailandpassword: ' + err, this)
        this.submitDisabled = false
      })
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
