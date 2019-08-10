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
        <n-link v-for="(i, index) in menuItems" :key="index" class="navbar-item" :to="i.to">
          {{ i.name }}
        </n-link>
        <template v-if="user && !user.isAnonymous">
          <div class="navbar-item">
            <b-dropdown aria-role="menu" position="is-bottom-left">
              <button class="button is-light" slot="trigger">
                <span>Me</span>
                <b-icon icon="menu-down"></b-icon>
              </button>
              
              <b-dropdown-item v-for="(i, index) in accountMenuItems" aria-role="menu-item" :key="index">
                <n-link :to="i.to">
                  {{ i.name }}
                </n-link>
              </b-dropdown-item>
              <b-dropdown-item aria-role="menu-item" @click="logout"><a>Sign out</a></b-dropdown-item>
            </b-dropdown>
          </div>
        </template>
        <template v-else>
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
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
import { fireAuth } from '~/plugins/firebase'

export default {
  name: 'Navbar',
  data() {
    return {
      user: null,
      menuItems: [
        { name: 'Race', to: '/race' },
        { name: 'Shop', to: '/shop' },
        { name: 'Inventory', to: '/inventory' }
      ],
      accountMenuItems: [
        { name: 'Profile', to: '/profile' },
        { name: 'Achievements', to: '/achievements' }
      ]
    }
  },
  mounted() {
    fireAuth().onAuthStateChanged((user) => {
      this.user = user
    })
  },
  methods: {
    logout() {
      fireAuth().signOut()
        .then(() => this.$router.push('/'))
        .catch(err => this.$disp_error('signOUt: ' + err, this))
    }
  }
}
</script>
