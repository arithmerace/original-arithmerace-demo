const passport = require('passport')

exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(500).json(err)
    }
    if (!user) {
      return res.status(401).json(info.message)
    }
    res.json(user)
  })(req, res, next)
}

exports.createNewUser = function(req, res, next) {
}