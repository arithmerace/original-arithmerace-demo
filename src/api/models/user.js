const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')

const User = new Schema({
  displayName: {
    type: String
  },
  username: {
    type: String
  },
  password: {type: String}
})

User.virtual('url').get(function() {
  return '/user/' + this.username
})

User.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', User)
