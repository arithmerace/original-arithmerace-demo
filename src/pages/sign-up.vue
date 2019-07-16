<template>
  <section class="section">
    <div class="container" width="50%">
      <form @submit.prevent>
        <b-field label="Username">
          <b-input
            v-model="form.username"
            required
            minlength="4"
            maxlength="20"
            type="text"
            placeholder="Pick a username"
          />
        </b-field>
        <b-field label="Email">
          <b-input v-model="form.email" required type="email" placeholder="Your email address" />
        </b-field>
        <b-field label="Password">
          <b-input v-model="form.password" required type="password" minlength="8" placeholder="Choose a password" />
        </b-field>
        <b-button native-type="submit" type="is-primary" @click="signup">Sign Up</b-button>
      </form>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SignUp',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      }
    }
  },
  methods: {
    signup() {
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
