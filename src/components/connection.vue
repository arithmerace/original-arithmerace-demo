<template>
<div>
  
</div>
</template>

<script>
import { fireRtdb, fireAuth } from '~/plugins/firebase'

export default {
  name: 'Connection',
  data() {
    return {
      wasConnected: false
    }
  },
  mounted() {
    fireAuth().onAuthStateChanged((user) => {
      if (user) {
        // Manage presence - https://firebase.google.com/docs/firestore/solutions/presence
        fireRtdb().ref('.info/connected').on('value', (snap) => {
          if (snap.val() === true) this.wasConnected = true
          else if (this.wasConnected) {
            this.$snackbar.open({
              indefinite: true,
              message: 'Uh oh! You were disconnected. Please reload the page.',
              type: 'is-danger'
            })
            return
          }
          
          const ustatusDBref = fireRtdb().ref('/ustatus/' + user.uid)
      
          ustatusDBref.onDisconnect().set({
            status: 'offline'
          }).then(() => {
            ustatusDBref.set({ status: 'online' }).catch((err) => {
              this.$disp_error(err, this)
            })
          }).catch((err) => {
            this.$disp_error(err, this)
          })
        })
      }
    })
  }
}
</script>
