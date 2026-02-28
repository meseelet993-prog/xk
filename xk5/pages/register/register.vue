<template>
  <view class="register-container">
    <view class="register-header">
      <text class="register-title">用户注册</text>
    </view>

    <view class="register-form">
      <view class="form-item">
        <input v-model="formData.username" type="text" placeholder="请输入用户名" class="form-input" />
      </view>

      <view class="form-item">
        <input v-model="formData.password" type="password" placeholder="请输入密码" class="form-input" />
      </view>

      <view class="form-item">
        <input v-model="formData.confirmPassword" type="password" placeholder="请确认密码" class="form-input" />
      </view>

      <view class="form-item">
        <input v-model="formData.phone" type="text" placeholder="请输入手机号" class="form-input" />
      </view>

      <view class="form-item">
        <input v-model="formData.email" type="text" placeholder="请输入邮箱" class="form-input" />
      </view>

      <view class="form-item">
        <input v-model="formData.realName" type="text" placeholder="请输入真实姓名" class="form-input" />
      </view>

      <view class="role-selection">
        <text class="role-label">选择角色</text>
        <view class="role-options">
          <view v-for="role in roles" :key="role.value" class="role-option"
            :class="{ active: formData.role === role.value }" @click="formData.role = role.value">
            <text>{{ role.label }}</text>
          </view>
        </view>
      </view>

      <button class="register-btn" :disabled="loading" :loading="loading" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </view>

    <view class="register-footer">
      <text class="link-text" @click="navigateToLogin">已有账号？立即登录</text>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        loading: false,
        baseUrl: 'http://localhost:8082', // 统一使用localhost
        formData: {
          username: '',
          password: '',
          confirmPassword: '',
          phone: '',
          email: '',
          realName: '',
          role: 'STUDENT'
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

    methods: {
      async handleRegister() {
        // 表单验证
        if (!this.validateForm()) return

        this.loading = true

        try {
          console.log('发送注册请求到:', `${this.baseUrl}/api/auth/register`)

          const response = await uni.request({
            url: `${this.baseUrl}/api/auth/register`,
            method: 'POST',
            data: this.formData,
            header: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          })

          console.log('注册响应:', response)

          if (response.statusCode === 200) {
            const result = response.data
            if (result.code === 200) {
              uni.showToast({
                title: '注册成功！',
                icon: 'success'
              })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } else {
              uni.showToast({
                title: result.message || '注册失败',
                icon: 'none'
              })
            }
          } else {
            throw new Error(`HTTP ${response.statusCode}`)
          }
        } catch (error) {
          console.error('注册失败:', error)
          uni.showToast({
            title: '注册失败，请检查网络连接',
            icon: 'none'
          })
        } finally {
          this.loading = false
        }
      },

      validateForm() {
        const {
          username,
          password,
          confirmPassword,
          phone,
          email,
          realName
        } = this.formData

        if (!username.trim()) {
          this.showError('请输入用户名')
          return false
        }

        if (!password.trim()) {
          this.showError('请输入密码')
          return false
        }

        if (password !== confirmPassword) {
          this.showError('两次密码输入不一致')
          return false
        }


        if (!realName.trim()) {
          this.showError('请输入真实姓名')
          return false
        }

        return true
      },

      showError(message) {
        uni.showToast({
          title: message,
          icon: 'none',
          duration: 3000
        })
      },

      navigateToLogin() {
        uni.navigateBack()
      }
    }
  }
</script>

<style scoped>
  .register-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #4A90E2 0%, #67B26F 100%);
    padding: 60rpx 40rpx;
  }

  .register-header {
    text-align: center;
    margin-bottom: 60rpx;
  }

  .register-title {
    font-size: 48rpx;
    font-weight: bold;
    color: #FFFFFF;
  }

  .register-form {
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

  .role-selection {
    margin-bottom: 40rpx;
  }

  .role-label {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 20rpx;
  }

  .role-options {
    display: flex;
    gap: 20rpx;
  }

  .role-option {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    background: #F8F9FA;
    border: 2rpx solid #E9ECEF;
    border-radius: 8rpx;
    color: #666666;
    font-size: 28rpx;
  }

  .role-option.active {
    background: #4A90E2;
    color: #FFFFFF;
    border-color: #4A90E2;
  }

  .register-btn {
    width: 100%;
    height: 88rpx;
    background: #4A90E2;
    color: #FFFFFF;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
  }

  .register-btn:disabled {
    background: #CCCCCC;
  }

  .register-footer {
    text-align: center;
    margin-top: 40rpx;
  }

  .link-text {
    color: #FFFFFF;
    font-size: 28rpx;
    text-decoration: underline;
  }
</style>