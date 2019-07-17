<template>
  <nav
    class="navbar header has-shadow is-primary"
    height="200"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="navbar-brand">
      <n-link
        class="navbar-item"
        to="/"
      >
        <img
          src="~assets/arithmerace_logo.png"
          alt="Arithmerace"
        >
      </n-link>

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
</template>

<script>
export default {
  name: 'Navbar',
  data() {
    return {
      menu_items: [
        { name: 'Race', to: '/race' },
        { name: 'Shop', to: '/store' },
        { name: 'Inventory', to: '/inventory' }
      ]
    }
  }
}
</script>
