<template>
  <div>
    <Navbar />
    <section class="main-content columns">
      <div class="container column is-10">
        <nuxt />
      </div>
    </section>
    <Connection />
  </div>
</template>

<script>
import Navbar from '~/components/navbar'
import Connection from '~/components/connection'

export default {
  components: {
    Connection,
    Navbar
  }
}
</script>
