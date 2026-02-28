// store/user.js
const user = {
  state: {
    userInfo: uni.getStorageSync('userInfo') || null,
    token: uni.getStorageSync('token') || ''
  },

  mutations: {
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
      uni.setStorageSync('userInfo', userInfo)
    },
    SET_TOKEN(state, token) {
      state.token = token
      uni.setStorageSync('token', token)
    },
    CLEAR_USER(state) {
      state.userInfo = null
      state.token = ''
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('token')
    }
  },

  actions: {
    // 登录
    async login({
      commit
    }, loginData) {
      try {
        const response = await uni.request({
          url: 'http://localhost:8092/api/auth/login',
          method: 'POST',
          data: loginData,
          header: {
            'Content-Type': 'application/json'
          }
        })

        // uni.request返回的是数组，第一个元素是错误信息，第二个是响应
        const result = response[1].data

        if (result.code === 200) {
          commit('SET_USER_INFO', result.data)
          // 如果有token，可以在这里存储
          // commit('SET_TOKEN', result.data.token)
          return Promise.resolve(result)
        } else {
          return Promise.reject(new Error(result.message))
        }
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 注册
    async register({
      commit
    }, userData) {
      try {
        const response = await uni.request({
          url: 'http://localhost:8082/api/auth/register',
          method: 'POST',
          data: userData,
          header: {
            'Content-Type': 'application/json'
          }
        })

        const result = response[1].data
        if (result.code === 200) {
          return Promise.resolve(result)
        } else {
          return Promise.reject(new Error(result.message))
        }
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 退出登录
    logout({
      commit
    }) {
      commit('CLEAR_USER')
      uni.reLaunch({
        url: '/pages/login/login'
      })
    }
  },

  getters: {
    isLogin: state => !!state.userInfo,
    userInfo: state => state.userInfo,
    userRole: state => state.userInfo ? state.userInfo.role : null
  }
}

export default user