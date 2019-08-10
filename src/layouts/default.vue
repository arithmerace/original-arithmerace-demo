<template>
  <div>
    <Navbar />
    <section class="main-content columns">
      <div class="container column is-10">
        <nuxt />
      </div>
    </section>
    <Footer />
    <Connection />
  </div>
</template>

<script>
import Navbar from '~/components/navbar'
import Connection from '~/components/connection'
import Footer from '~/components/footer'

export default {
  components: {
    Connection,
    Navbar,
    Footer
  }
}
</script>
