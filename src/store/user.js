import axios from 'axios'

export const state = () => ({
  user: null
})

export const mutations = {
  SET_USER(state, user) {
    state.user = user
  }
}

export const actions = {

}