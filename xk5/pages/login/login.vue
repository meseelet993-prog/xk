<template>
  <view class="login-container">
    <!-- 顶部标题 -->
    <view class="login-header">
      <text class="login-title">心理健康咨询平台</text>
      <text class="login-subtitle">专业心理咨询服务</text>
    </view>

    <!-- 角色选择 -->
    <view class="role-tabs">
      <view v-for="role in roles" :key="role.value" class="role-tab" :class="{ active: currentRole === role.value }"
        @click="handleRoleChange(role.value)">
        <text>{{ role.label }}</text>
      </view>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-item">
        <input v-model="formData.username" type="text" placeholder="请输入用户名" class="form-input"
          @input="onInput('username', $event)" />
      </view>

      <view class="form-item">
        <input v-model="formData.password" type="password" placeholder="请输入密码" class="form-input"
          @input="onInput('password', $event)" />
      </view>

      <button class="login-btn" :disabled="loading" :loading="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </view>

    <!-- 底部操作链接 -->
    <view class="login-footer">
      <text class="link-text" @click="navigateToRegister">立即注册</text>
      <text class="link-text" @click="navigateToForget">忘记密码？</text>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        currentRole: 'STUDENT', // 改为大写，与后端枚举匹配
        loading: false,
        formData: {
          username: '',
          password: ''
        },
        roles: [{
            label: '学生',
            value: 'STUDENT'
          },
          {
            label: '咨询师',
            value: 'CONSULTANT'
          },
          {
            label: '管理员',
            value: 'ADMIN'
          }
        ]
      }
    },

    onLoad() {
      console.log('登录页面加载完成')
      this.testBackendConnection()
    },

    methods: {
      handleRoleChange(role) {
        console.log('角色切换:', role)
        this.currentRole = role
      },

      onInput(field, e) {
        this.formData[field] = e.detail.value
      },

      async testBackendConnection() {
        try {
          console.log('测试后端连接...')
          const response = await new Promise((resolve, reject) => {
            uni.request({
              url: 'http://localhost:8082/api/health',
              method: 'GET',
              timeout: 5000,
              success: (res) => resolve(res),
              fail: (err) => reject(err)
            })
          })

          console.log('健康检查响应:', response)

          let result
          if (response && response.data) {
            result = response.data
          } else if (Array.isArray(response) && response[1] && response[1].data) {
            result = response[1].data
          }

          if (result && result.status === 'UP') {
            uni.showToast({
              title: '后端连接正常',
              icon: 'success'
            })
          } else {
            uni.showToast({
              title: '后端状态异常',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('后端连接测试失败:', error)
          uni.showToast({
            title: '后端连接失败',
            icon: 'none'
          })
        }
      },

      async handleLogin() {
        // 表单验证
        if (!this.formData.username.trim()) {
          uni.showToast({
            title: '请输入用户名',
            icon: 'none'
          })
          return
        }

        if (!this.formData.password.trim()) {
          uni.showToast({
            title: '请输入密码',
            icon: 'none'
          })
          return
        }

        this.loading = true

        try {
          console.log('开始登录请求...')
          console.log('当前选择的角色:', this.currentRole)

          // 使用更稳定的请求方式
          const response = await new Promise((resolve, reject) => {
            uni.request({
              url: 'http://localhost:8082/api/auth/login',
              method: 'POST',
              data: {
                username: this.formData.username,
                password: this.formData.password,
                role: this.currentRole // 添加当前选择的角色到请求参数
              },
              header: {
                'Content-Type': 'application/json'
              },
              timeout: 10000,
              success: (res) => {
                console.log('请求成功:', res)
                resolve(res)
              },
              fail: (err) => {
                console.log('请求失败:', err)
                reject(err)
              }
            })
          })

          console.log('完整响应对象:', JSON.stringify(response, null, 2))

          // 安全地获取数据
          let result
          if (response && response.data) {
            // 正常情况：response.data 包含后端返回的数据
            result = response.data
          } else if (Array.isArray(response) && response[1] && response[1].data) {
            // 某些情况下uni.request返回数组
            result = response[1].data
          } else {
            throw new Error('响应数据格式异常: ' + JSON.stringify(response))
          }

          console.log('登录结果:', JSON.stringify(result, null, 2))

          if (result.code === 200) {
            uni.showToast({
              title: '登录成功！',
              icon: 'success'
            })

            // === 修改部分开始：正确存储用户信息 ===
            console.log('=== 开始解析用户信息 ===')

            // 首先，查找用户ID
            let userId = null
            let userDataToStore = null

            // 尝试从多个可能的路径查找用户ID
            if (result.data && result.data.id) {
              userId = result.data.id
              userDataToStore = result.data
              console.log('找到用户ID在 result.data.id:', userId)
            } else if (result.data && result.data.userId) {
              userId = result.data.userId
              userDataToStore = result.data
              console.log('找到用户ID在 result.data.userId:', userId)
            } else if (result.data && result.data.studentId) {
              userId = result.data.studentId
              userDataToStore = result.data
              console.log('找到用户ID在 result.data.studentId:', userId)
            } else if (result.data && result.data.user && result.data.user.id) {
              userId = result.data.user.id
              userDataToStore = result.data.user
              console.log('找到用户ID在 result.data.user.id:', userId)
            } else if (result.data && result.data.student && result.data.student.id) {
              userId = result.data.student.id
              userDataToStore = result.data.student
              console.log('找到用户ID在 result.data.student.id:', userId)
            }

            // 如果没找到，尝试从所有嵌套对象中递归查找
            if (!userId && result.data) {
              console.log('未找到ID，开始深度搜索...')
              console.log('result.data 的 keys:', Object.keys(result.data))

              const findIdRecursively = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return null

                for (const key in obj) {
                  const currentPath = path ? `${path}.${key}` : key

                  // 如果字段名包含"id"且值为数字类型
                  if (key.toLowerCase().includes('id') &&
                    (typeof obj[key] === 'number' ||
                      (typeof obj[key] === 'string' && !isNaN(obj[key]) && obj[key].trim() !== ''))) {
                    console.log(`在 ${currentPath} 找到可能的ID:`, obj[key])
                    return {
                      id: obj[key],
                      path: currentPath,
                      data: obj
                    }
                  }

                  // 递归查找嵌套对象
                  if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const found = findIdRecursively(obj[key], currentPath)
                    if (found) return found
                  }
                }
                return null
              }

              const foundId = findIdRecursively(result.data)
              if (foundId) {
                userId = foundId.id
                userDataToStore = foundId.data
              }
            }

            // 如果找到了用户ID，准备存储
            if (userId) {
              // 确保userId是数字类型
              userId = Number(userId)

              // 获取角色信息
              let userRole = this.getUserRoleFromResponse(result)

              // 准备存储的用户信息对象
              const userInfoToStore = {
                ...userDataToStore,
                id: userId, // 确保有id字段且为数字
                determinedRole: userRole
              }

              // 存储用户信息
              uni.setStorageSync('userInfo', userInfoToStore)
              console.log('存储的用户信息:', JSON.stringify(userInfoToStore, null, 2))

              // 存储token（如果有）
              if (result.data && result.data.token) {
                uni.setStorageSync('token', result.data.token)
                console.log('token已存储')
              }

              // 延迟跳转，让用户看到成功提示
              setTimeout(() => {
                // 跳转到首页并传递角色参数
                uni.switchTab({
                  url: `/pages/index/index?role=${userRole}`,
                  success: () => {
                    console.log('跳转到首页成功，传递角色:', userRole)
                  },
                  fail: (err) => {
                    console.error('switchTab跳转失败:', err)
                    // 备用方案：使用 reLaunch
                    uni.reLaunch({
                      url: `/pages/index/index?role=${userRole}`
                    })
                  }
                })
              }, 1500)
            } else {
              console.error('未找到用户ID，无法存储用户信息')
              console.log('result.data结构:', JSON.stringify(result.data, null, 2))

              uni.showToast({
                title: '登录失败：无法获取用户信息',
                icon: 'none',
                duration: 3000
              })
            }
            // === 修改部分结束 ===
          } else {
            uni.showToast({
              title: result.message || '登录失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('登录请求失败:', error)

          // 更详细的错误处理
          if (error.errMsg) {
            if (error.errMsg.includes('timeout')) {
              uni.showToast({
                title: '请求超时，请检查后端服务',
                icon: 'none'
              })
            } else if (error.errMsg.includes('fail')) {
              uni.showToast({
                title: '网络请求失败，请检查连接',
                icon: 'none'
              })
            } else {
              uni.showToast({
                title: '请求错误: ' + error.errMsg,
                icon: 'none'
              })
            }
          } else {
            uni.showToast({
              title: '错误: ' + error.message,
              icon: 'none'
            })
          }
        } finally {
          this.loading = false
        }
      },

      // 添加辅助方法获取角色
      getUserRoleFromResponse(result) {
        let userRole = null

        // 从多个可能的位置获取角色信息
        if (result.data && result.data.role) {
          userRole = result.data.role.toLowerCase()
          console.log('从 result.data.role 获取角色:', userRole)
        } else if (result.data && result.data.user && result.data.user.role) {
          userRole = result.data.user.role.toLowerCase()
          console.log('从 result.data.user.role 获取角色:', userRole)
        }

        // 检查是否有其他可能的字段名
        if (!userRole && result.data) {
          const possibleRoleKeys = ['userType', 'type', 'userRole', 'roleType', 'user_role']
          for (const key of possibleRoleKeys) {
            if (result.data[key]) {
              userRole = result.data[key].toLowerCase()
              console.log(`从 ${key} 获取角色:`, userRole)
              break
            }
          }
        }

        // 如果后端没有返回角色，使用前端当前选择的角色
        if (!userRole) {
          userRole = this.currentRole.toLowerCase()
          console.log('后端未返回角色，使用前端选择的角色:', userRole)
        }

        // 规范化角色值
        const validRoles = ['student', 'consultant', 'admin']
        if (!validRoles.includes(userRole)) {
          console.warn('角色不合法，转换为小写并检查:', userRole)
          userRole = userRole.toLowerCase()

          if (!validRoles.includes(userRole)) {
            const roleMap = {
              'student': 'student',
              'consultant': 'consultant',
              'admin': 'admin',
              '管理员': 'admin',
              '咨询师': 'consultant',
              '学生': 'student'
            }
            userRole = roleMap[userRole] || 'student'
          }
        }

        console.log('最终确定的角色:', userRole)
        return userRole
      },

      navigateToRegister() {
        uni.navigateTo({
          url: '/pages/register/register'
        })
      },

      navigateToForget() {
        uni.navigateTo({
          url: '/pages/forget-password/forget-password'
        })
      }
    }
  }
</script>

<style scoped>
  .login-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #4A90E2 0%, #67B26F 100%);
    padding: 60rpx 40rpx;
    display: flex;
    flex-direction: column;
  }

  .login-header {
    text-align: center;
    margin-bottom: 80rpx;
  }

  .login-title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
  }

  .login-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  .role-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50rpx;
    padding: 8rpx;
    margin-bottom: 60rpx;
  }

  .role-tab {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    border-radius: 40rpx;
    color: #FFFFFF;
    font-size: 28rpx;
    transition: all 0.3s ease;
  }

  .role-tab.active {
    background: #FFFFFF;
    color: #4A90E2;
    font-weight: bold;
  }

  .login-form {
    background: #FFFFFF;
    border-radius: 20rpx;
    padding: 60rpx 40rpx;
    box-shadow: 0 10rpx 30rpx rgba(74, 144, 226, 0.1);
  }

  .form-item {
    margin-bottom: 40rpx;
  }

  .form-input {
    width: 100%;
    height: 88rpx;
    background: #F8F9FA;
    border: 2rpx solid #E9ECEF;
    border-radius: 8rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }

  .login-btn {
    width: 100%;
    height: 88rpx;
    background: #4A90E2;
    color: #FFFFFF;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    margin-top: 20rpx;
  }

  .login-btn:disabled {
    background: #CCCCCC;
  }

  .login-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 40rpx;
    padding: 0 20rpx;
  }

  .link-text {
    color: #FFFFFF;
    font-size: 28rpx;
    text-decoration: underline;
  }
</style>