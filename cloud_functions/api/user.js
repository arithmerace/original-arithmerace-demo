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
      // Validate username.
      if (!/^([a-z0-9_-]){4,18}$/.test(data.username)) {
        admin.auth().deleteUser(ctx.auth.uid)
        
        return { error: 'username-invalid' }
      }
      
      // Link username to user profile
      snap.ref.set({ uid: ctx.auth.uid })
      
      // Create user profile and link to username
      admin.database().ref('user/' + ctx.auth.uid).set({
        username: data.username,
        robot: 'guest_bot',
        account: {
          arithmecoin: cfg.account.initialCoins,
          robots: {
            'guest_bot': { owned: true }
          }
        },
        profile: {
          joined: admin.database.ServerValue.TIMESTAMP
        },
        career: {
          totalRaces: 0,
          finishedRaces: {
            '1': 0
          }
        }
      })
      return { success: true }
    })
}

// exports.submitUserSkills = function(data, ctx) {
//   admin.database().ref('/user/' + ctx.auth.uid + '/career/skills').set(data.skills)
// }
