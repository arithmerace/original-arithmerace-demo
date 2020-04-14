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
        <b-field label="Email (optional)">
          <b-input v-model="form.email" type="email" placeholder="Your email address" />
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
import axios from 'axios'

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
      axios.post('/api/createNewUser', {
        username: this.form.username,
        password: this.form.password
      })
      .then((response) => {

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
