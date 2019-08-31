const admin = require('firebase-admin')
const cfg = require('./config.json')

exports.createNewUser = function(data, ctx) {
  return admin.database().ref('/usernames/' + data.username).once('value')
    .then((snap) => {
      if (snap.val()) {
        // Username taken, delete user and send error to client
        admin.auth().deleteUser(ctx.auth.uid)
        
        return { error: 'username-taken'}
      }
      // Verify username
      if (data.username.length > 18 || data.username.length < 4) {
        admin.auth().deleteUser(ctx.auth.uid)
        
        return { error: 'username-invalid' }
      }
      
      // Link username to user profile
      snap.ref.set({ uid: ctx.auth.uid })
      
      // Create user profile and link to username
      admin.database().ref('user/' + ctx.auth.uid).set({
        username: data.username,
        account: {
          arithmecoin: cfg.account.initialCoins
        },
        profile: {
          joined: admin.database.ServerValue.TIMESTAMP
        },
        career: {
          totalRaces: 0
        }
      })
      return { success: true }
    })
}
