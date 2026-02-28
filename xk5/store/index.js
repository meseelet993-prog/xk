import { createStore } from 'vuex'
import chat from './modules/chat'

const store = createStore({
  modules: {
    chat
  },
  state: {
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || {}
  },

  getters: {
    token: state => state.token,
    userInfo: state => state.userInfo,
    userRole: state => state.userInfo.role,
    userId: state => state.userInfo.id
  },

  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      uni.setStorageSync('token', token)
    },

    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
      uni.setStorageSync('userInfo', userInfo)
    },

    CLEAR_USER_INFO(state) {
      state.token = ''
      state.userInfo = {}
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  },

  actions: {
    login({
      commit
    }, {
      token,
      userInfo
    }) {
      commit('SET_TOKEN', token)
      commit('SET_USER_INFO', userInfo)
    },

    logout({
      commit
    }) {
      commit('CLEAR_USER_INFO')
    }
  }
})

export default store