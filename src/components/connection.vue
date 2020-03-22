<template>
  <div />
</template>

<script>
import { fireDb, fireAuth } from '~/plugins/firebase'

export default {
  name: 'Connection',
  data() {
    return {
    }
  },
  mounted() {
    fireAuth().onAuthStateChanged((user) => {
      if (user) {
        // Manage presence - https://firebase.google.com/docs/firestore/solutions/presence
        fireDb().ref('.info/connected').on('value', (snap) => {
          if (snap.val() === true) this.wasConnected = true
          else if (this.wasConnected) {
            this.$snackbar.open({
              indefinite: true,
              message: 'Uh oh! You were disconnected. Please reload the page and try again.',
              type: 'is-danger'
            })
            return
          }
          
          const ustatusDBref = fireDb().ref('/ustatus/' + user.uid)
      
          ustatusDBref.onDisconnect().set({
            status: 'offline'
          }).then(() => {
            ustatusDBref.set({ status: 'online' }).catch((err) => {
              this.$disp_error('ustatusset:' + err, this)
            })
          }).catch((err) => {
            this.$disp_error('ustatusset:' + err, this)
          })
        })
      }
    })
  }
  // ,
  // watch: {
  //   $route() {
  //     if (this.$route.name === 'race') {
  //       this.wasOnRacePage = true
  //     } else if (this.wasOnRacePage) {
  //       fireDb().ref('waitingroom/' + fireAuth().currentUser.uid).remove().catch(err => this.$disp_error('removefromWR' + err, this))
        
  //       this.wasOnRacePage = false
  //     }
  //   }
  // }
}
</script>
