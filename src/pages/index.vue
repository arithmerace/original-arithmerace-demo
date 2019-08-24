<template>
  <section class="container has-text-centered">
    <h1 class="is-size-2">
      Welcome to Arithmerace Alpha!
    </h1>
    <p>Arithmerace is a competitive multiplayer online math game. It's free and you don't even need an account to play.</p>
    <p>This is an alpha version, which means it's in the early stages of development. That means there will be lots of bugs and most things probably won't work yet.</p>
    <p>
      Are you ready to race? Just click on the sign up button above to create an account or
      <n-link to="/race">
        click here to race as a guest!
      </n-link>
    </p>
    <br></br>
    <h2 class="is-size-4">
      More info
    </h2>
    <p>Currently, you need 2 players to start a race so if a race isn't starting get a friend to play with you.</p>
  </section>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>
