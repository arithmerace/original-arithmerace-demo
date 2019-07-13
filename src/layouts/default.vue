<template>
  <div>
    <nav
      class="navbar header has-shadow is-primary"
      height="200"
      role="navigation"
      aria-label="main navigation"
    >
      <div class="navbar-brand">
        <a
          class="navbar-item"
          href="/"
        >
          <img
            src="~assets/arithmerace_logo.png"
            alt="Arithmerace"
          >
        </a>

        <div class="navbar-burger">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div class="navbar-menu">
        <div class="navbar-start" />
        <div class="navbar-end">
          <n-link v-for="(i, index) in menu_items" :key="index" class="navbar-item" :to="i.to">
            {{ i.name }}
          </n-link>
          <n-link to="/login" class="navbar-item">
            Login
          </n-link>
          <div class="navbar-item">
            <div class="buttons">
              <n-link to="/sign-up" class="button is-light">
                Sign Up
              </n-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <section class="main-content columns">
      <div class="container column is-10">
        <nuxt />
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menu_items: [
        { name: 'Race', to: '/race' },
        { name: 'Store', to: '/store' },
        { name: 'Inventory', to: '/inventory' }
      ]
    }
  }
}
</script>
