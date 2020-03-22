import Vue from 'vue'

Vue.prototype.$disp_error = (err, v) => {
  console.error(err)
  v.$snackbar.open({
    duration: 60000,
    message: 'Uh oh! Something went wrong. Please try again and if it keeps happening, please contact us with this error: ' + err.toString(),
    type: 'is-danger'
  })
}
