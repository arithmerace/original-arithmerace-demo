const admin = require('firebase-admin')
const cfg = require('./config.json')
const robotList = require('./robotList.json')

exports.purchaseRobot = function(data, ctx) {
  return admin.database().ref('user/' + ctx.auth.uid).once('value')
    .then((snap) => {
      const arithmecoinSnap = snap.child('account/arithmecoin')
      const robot = robotList.robots[data.robot]
      if (!robot) return { success: false }
      if (robot.price > arithmecoinSnap.val()) return { success: false }
      
      arithmecoinSnap.ref.set(arithmecoinSnap.val() - robot.price)
      snap.child('account/robots/' + data.robot).ref.set({ owned: true })
      return { success: true }
    })
}

exports.equipRobot = function(data, ctx) {
  return admin.database().ref('user/' + ctx.auth.uid).once('value')
    .then((snap) => {
      if (!(snap.child('account/robots').val()[data.robot] && snap.child('account/robots').val()[data.robot].owned)) return
      
      snap.child('robot').ref.set(data.robot)
      return { success: true }
    })
}
