<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 检查登录状态
    this.checkLoginStatus()
  },
  onShow: function() {
    console.log('App Show')
    const token = uni.getStorageSync('token')
    if (token) {
      this.$store.dispatch('chat/initWebSocket')
    }
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    checkLoginStatus() {
      const token = uni.getStorageSync('token')
      if (!token) {
        // 未登录，跳转到登录页
        uni.redirectTo({
          url: '/pages/login/login'
        })
      } else {
        this.$store.dispatch('chat/initWebSocket')
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #F5F7FA;
}

/* 自定义主题色 */
:root {
  --primary-color: #4A90E2;
  --secondary-color: #F5F7FA;
  --success-color: #09BB07;
  --warning-color: #FF9500;
  --error-color: #FF3B30;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #EEEEEE;
}

/* 通用按钮样式 */
.primary-btn {
  background: var(--primary-color);
  color: #FFFFFF;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn:disabled {
  background: #CCCCCC;
}

/* 卡片样式 */
.common-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

/* 响应式设计 */
@media (max-width: 750px) {
  .common-card {
    margin: 20rpx;
    padding: 24rpx 20rpx;
  }
}
</style>