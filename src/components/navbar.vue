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
        <template v-if="user && !user.isAnonymous">
          <n-link v-for="(i, index) in loggedInMenuItems" :key="index" class="navbar-item" :to="i.to">
            {{ i.name }}
          </n-link>
          <div class="navbar-item">
            <b-dropdown aria-role="menu" position="is-bottom-left">
              <button slot="trigger" class="button is-light">
                <span>Me</span>
                <b-icon icon="menu-down" />
              </button>
              
              <b-dropdown-item aria-role="menu-item">
                <n-link :to="'/player/' + username">
                  Profile
                </n-link>
              </b-dropdown-item>
              <b-dropdown-item v-for="(i, index) in accountMenuItems" :key="index" aria-role="menu-item">
                <n-link :to="i.to">
                  {{ i.name }}
                </n-link>
              </b-dropdown-item>
              <b-dropdown-item aria-role="menu-item" @click="logout">
                <a>Sign out</a>
              </b-dropdown-item>
            </b-dropdown>
          </div>
        </template>
        <template v-else>
          <n-link v-for="(i, index) in loggedOutMenuItems" :key="index" class="navbar-item" :to="i.to">
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
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
import { fireAuth, fireDb } from '~/plugins/firebase'

export default {
  name: 'Navbar',
  data() {
    return {
      user: null,
      username: 'blah',
      loggedInMenuItems: [
        { name: 'Race', to: '/race' },
        { name: 'Shop', to: '/shop' },
        { name: 'Inventory', to: '/inventory' }
      ],
      loggedOutMenuItems: [
        { name: 'Race', to: '/race' },
        { name: 'Students', to: '/student/about' },
        { name: 'Teachers', to: '/teachers/about' }
      ],
      accountMenuItems: [
        { name: 'Achievements', to: '/achievements' },
        { name: 'Settings', to: '/settings' }
      ]
    }
  },
  mounted() {
    fireAuth().onAuthStateChanged((user) => {
      this.user = user
      fireDb().ref('/user/' + user.uid + '/username').once('value', (snap) => {
        this.username = snap.val()
      }).catch(err => this.disp_error('navbarGetUName: ' + err, this))
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
