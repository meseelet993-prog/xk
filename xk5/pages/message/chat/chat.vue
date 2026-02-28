<template>
  <view class="chat-container">
    <!-- 聊天头部 -->
    <view class="chat-header">
      <view class="header-left">
        <uni-icons 
          type="back" 
          size="24" 
          color="#333" 
          class="back-icon"
          @click="navigateBack"
        />
      </view>
      
      <view class="user-info">
        <image :src="targetUser.avatar" class="avatar" />
        <view class="user-details">
          <text class="name">{{ targetUser.name }}</text>
          <text class="role">{{ getRoleText(targetUser.role) }}</text>
          <text v-if="targetUser.status" class="status" :class="targetUser.status">
            {{ targetUser.status === 'online' ? '在线' : '离线' }}
          </text>
        </view>
      </view>
      
      <view class="header-right">
        <uni-icons 
          type="more" 
          size="24" 
          color="#333" 
          @click="showActionSheet"
        />
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view 
      class="message-list" 
      scroll-y 
      :scroll-top="scrollTop"
      scroll-with-animation
      @scroll="onScroll"
    >
      <view class="messages-wrapper">
        <!-- 日期分隔符 -->
        <view v-if="showDateDivider" class="date-divider">
          <text>{{ formatDateDivider() }}</text>
        </view>
        
        <view 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="[isOwnMessage(message) ? 'own' : 'other']"
        >
          <!-- 对方消息 -->
          <view v-if="!isOwnMessage(message)" class="other-message">
            <image :src="targetUser.avatar" class="message-avatar" />
            <view class="message-content">
              <text v-if="showSenderName(message)" class="sender-name">{{ targetUser.name }}</text>
              <view class="message-bubble">
                <text class="message-text">{{ message.content }}</text>
                <text v-if="message.type === 'urgent'" class="urgent-tag">紧急</text>
              </view>
              <text class="message-time">{{ formatTime(message.time) }}</text>
            </view>
          </view>

          <!-- 自己消息 -->
          <view v-else class="own-message">
            <view class="message-content">
              <text v-if="message.status" class="message-status">
                {{ getMessageStatusText(message.status) }}
              </text>
              <text class="message-time">{{ formatTime(message.time) }}</text>
              <view class="message-bubble">
                <text class="message-text">{{ message.content }}</text>
                <text v-if="message.type === 'urgent'" class="urgent-tag">紧急</text>
              </view>
            </view>
            <image :src="userInfo.avatar" class="message-avatar" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-section">
      <!-- 咨询师端快捷回复 -->
      <view v-if="userRole === 'consultant'" class="quick-replies">
        <scroll-view class="quick-replies-scroll" scroll-x>
          <view class="quick-reply-list">
            <view 
              v-for="reply in quickReplies" 
              :key="reply.id"
              class="quick-reply-item"
              @click="sendQuickReply(reply.text)"
            >
              <text>{{ reply.text }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <view class="input-wrapper">
        <view class="input-left">
          <uni-icons 
            type="plus" 
            size="24" 
            color="#666" 
            class="add-icon"
            @click="toggleMoreActions"
          />
        </view>
        
        <textarea
          v-model="inputText"
          class="message-input"
          :placeholder="getInputPlaceholder()"
          maxlength="500"
          @confirm="sendMessage"
          @input="onInputChange"
        />
        
        <view class="input-right">
          <view v-if="inputText" class="text-count">
            <text>{{ inputText.length }}/500</text>
          </view>
          <button 
            class="send-btn" 
            :disabled="!inputText.trim()" 
            @click="sendMessage"
          >
            <text class="send-text">发送</text>
          </button>
        </view>
      </view>

      <!-- 更多操作面板 -->
      <view v-if="showMoreActions" class="more-actions">
        <view class="action-item" @click="sendUrgentMessage">
          <view class="action-icon urgent">⚠️</view>
          <text class="action-text">紧急消息</text>
        </view>
        <view class="action-item" @click="sendAppointmentReminder">
          <view class="action-icon appointment">📅</view>
          <text class="action-text">预约提醒</text>
        </view>
        <view v-if="userRole === 'consultant'" class="action-item" @click="sendConsultationSummary">
          <view class="action-icon summary">📝</view>
          <text class="action-text">咨询总结</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      targetUser: {},
      inputText: '',
      scrollTop: 0,
      userInfo: {},
      userRole: 'student',
      showMoreActions: false,
      showDateDivider: true,
      conversationId: null,
      quickReplies: [
        { id: 1, text: '请问有什么可以帮助您的？' },
        { id: 2, text: '请详细描述一下您的情况。' },
        { id: 3, text: '我理解您的感受。' },
        { id: 4, text: '建议您尝试放松训练。' },
        { id: 5, text: '我们下次咨询时间确定了吗？' }
      ]
    }
  },
  
  computed: {
    ...mapState('chat', {
      storeMessages: state => state.messages
    }),
    messages() {
      return this.storeMessages[this.conversationId] || []
    }
  },

  watch: {
    messages() {
      this.scrollToBottom()
    }
  },
  
  onLoad(options) {
    this.loadUserInfo()
    this.initChat(options)
    
    // 初始化 WebSocket (如果未连接)
    this.$store.dispatch('chat/initWebSocket')
  },
  
  onShow() {
    // 页面显示时刷新消息状态
    this.markMessagesAsRead()
  },
  
  onHide() {
    // 页面隐藏时保存聊天状态
    // this.saveChatState() // Not needed with store
  },
  
  onUnload() {
    // 页面卸载时标记所有消息为已读
    this.markAllMessagesAsRead()
    this.$store.commit('chat/SET_CURRENT_CONVERSATION', null)
  },
  
  methods: {
    ...mapActions('chat', ['sendMessage', 'getConversationMessages']),

    // 加载用户信息
    loadUserInfo() {
      try {
        const storedUserInfo = uni.getStorageSync('userInfo')
        if (storedUserInfo && storedUserInfo.role) {
          this.userInfo = storedUserInfo
          this.userRole = storedUserInfo.role
          console.log('当前用户角色:', this.userRole)
        } else {
          console.log('未找到用户信息，使用默认设置')
          this.userInfo = {
            avatar: '/static/images/avatars/default.png',
            name: '用户'
          }
          this.userRole = 'student'
        }
      } catch (e) {
        console.error('加载用户信息失败:', e)
      }
    },
    
    // 初始化聊天
    initChat(options) {
      const { id, name, role, studentId } = options
      
      // 设置对话ID
      this.conversationId = id || studentId || '1'
      this.$store.commit('chat/SET_CURRENT_CONVERSATION', this.conversationId)
      
      // 设置聊天对象信息
      this.targetUser = {
        id: this.conversationId,
        name: name || '未知用户',
        role: role || (this.userRole === 'student' ? 'consultant' : 'student'),
        avatar: this.getTargetAvatar(role),
        status: 'online'
      }
      
      console.log('初始化聊天:', {
        targetUser: this.targetUser,
        userRole: this.userRole
      })
      
      // 加载消息记录
      this.loadMessages(this.conversationId)
    },
    
    // 获取聊天对象头像 - 修复头像显示问题
    getTargetAvatar(role) {
      const basePath = '/static/images/avatars/'
      
      // 如果明确指定了角色，根据角色返回对应头像
      if (role === 'student') {
        return basePath + 'student1.jpg'
      } else if (role === 'consultant') {
        return basePath + 'consultant1.jpg'
      }
      
      // 如果没有指定角色，根据当前用户角色推断
      if (this.userRole === 'student') {
        // 学生端：对方是咨询师
        return basePath + 'consultant1.jpg'
      } else if (this.userRole === 'consultant') {
        // 咨询师端：对方是学生
        return basePath + 'student1.jpg'
      }
      
      // 默认返回咨询师头像
      return basePath + 'consultant1.jpg'
    },
    
    // 加载消息记录
    loadMessages(conversationId) {
      this.getConversationMessages(conversationId)
      
      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.inputText.trim()) return

      const content = this.inputText.trim()
      
      // Dispatch action
      const success = await this.$store.dispatch('chat/sendMessage', {
        conversationId: this.conversationId,
        content: content,
        type: 'normal'
      })

      if (success) {
        this.inputText = ''
        this.showMoreActions = false
        this.scrollToBottom()
      } else {
        uni.showToast({
          title: '发送失败，请检查网络',
          icon: 'none'
        })
      }
    },
    
    // 发送快捷回复
    sendQuickReply(text) {
      this.inputText = text
      this.sendMessage()
    },
    
    // 发送紧急消息
    sendUrgentMessage() {
      uni.showModal({
        title: '发送紧急消息',
        content: '紧急消息会高亮显示并通知对方优先处理，确定发送吗？',
        confirmText: '发送',
        success: async (res) => {
          if (res.confirm) {
            const success = await this.$store.dispatch('chat/sendMessage', {
              conversationId: this.conversationId,
              content: this.inputText || '[紧急] 需要立即关注的问题',
              type: 'urgent',
              targetUser: this.targetUser
            })
            
            if (success) {
              this.inputText = ''
              this.showMoreActions = false
              this.scrollToBottom()
            }
          }
        }
      })
    },
    
    // 发送预约提醒
    sendAppointmentReminder() {
      const reminderText = `提醒：我们的咨询预约时间即将开始，请做好准备。`
      this.inputText = reminderText
      this.sendMessage()
    },
    
    // 发送咨询总结
    sendConsultationSummary() {
      const summaryText = `本次咨询总结：\n1. 问题识别\n2. 建议方案\n3. 后续计划`
      this.inputText = summaryText
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        setTimeout(() => {
          // 确保组件未销毁，避免设置 scrollTop 报错
          if (this._isDestroyed) return
          this.scrollTop = 999999
        }, 100)
      })
    },
    
    // 判断是否是自己发送的消息
    isOwnMessage(message) {
      return message.sender === 'me' || message.sender === this.userInfo.id // Adjust based on how 'sender' is stored
    },
    
    // 显示发送者姓名（群聊或咨询师端需要）
    showSenderName(message) {
      return !this.isOwnMessage(message) && this.userRole === 'consultant'
    },
    
    // 获取输入框占位符
    getInputPlaceholder() {
      if (this.userRole === 'consultant') {
        return '回复学生消息...'
      } else {
        return '输入消息向咨询师提问...'
      }
    },
    
    // 获取角色文本
    getRoleText(role) {
      const roleMap = {
        student: '学生',
        consultant: '咨询师',
        admin: '管理员'
      }
      return roleMap[role] || '用户'
    },
    
    // 获取消息状态文本
    getMessageStatusText(status) {
      const statusMap = {
        sending: '发送中',
        sent: '已发送',
        read: '已读',
        failed: '发送失败'
      }
      return statusMap[status] || ''
    },
    
    // 输入变化处理
    onInputChange(e) {
      // 可以在这里实现输入提示或其他功能
    },
    
    // 切换更多操作
    toggleMoreActions() {
      this.showMoreActions = !this.showMoreActions
    },
    
    // 显示操作菜单
    showActionSheet() {
      const items = this.userRole === 'consultant' 
        ? ['查看学生资料', '咨询记录', '标记紧急', '清除记录']
        : ['查看咨询师资料', '咨询记录', '投诉建议', '清除记录']
      
      uni.showActionSheet({
        itemList: items,
        success: (res) => {
          this.handleActionSheetSelect(res.tapIndex)
        }
      })
    },
    
    // 处理操作菜单选择
    handleActionSheetSelect(index) {
      const actions = this.userRole === 'consultant' 
        ? ['viewProfile', 'viewRecords', 'markUrgent', 'clearHistory']
        : ['viewProfile', 'viewRecords', 'complaint', 'clearHistory']
      
      const action = actions[index]
      switch (action) {
        case 'viewProfile':
          this.viewUserProfile()
          break
        case 'viewRecords':
          this.viewConsultationRecords()
          break
        case 'markUrgent':
          this.markConversationUrgent()
          break
        case 'complaint':
          this.submitComplaint()
          break
        case 'clearHistory':
          this.clearChatHistory()
          break
      }
    },
    
    // 查看用户资料
    viewUserProfile() {
      uni.showToast({
        title: `查看${this.targetUser.name}的资料`,
        icon: 'none'
      })
    },
    
    // 查看咨询记录
    viewConsultationRecords() {
      uni.showToast({
        title: '查看咨询记录',
        icon: 'none'
      })
    },
    
    // 标记对话为紧急
    markConversationUrgent() {
      uni.showToast({
        title: '对话已标记为紧急',
        icon: 'success'
      })
    },
    
    // 提交投诉建议
    submitComplaint() {
      uni.navigateTo({
        url: '/pages/profile/feedback/feedback'
      })
    },
    
    // 清除聊天记录
    clearChatHistory() {
      uni.showModal({
        title: '清除聊天记录',
        content: '确定要清除所有聊天记录吗？此操作不可恢复。',
        confirmText: '清除',
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) {
            // this.messages = [] // Should use action
            uni.showToast({
              title: '记录已清除',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 标记消息为已读
    markMessagesAsRead() {
       // Should dispatch action to API
    },
    
    // 标记所有消息为已读（退出聊天时调用）
    markAllMessagesAsRead() {
      // 发出全局事件，通知消息列表页面更新红点状态
      uni.$emit('conversationRead', {
        conversationId: this.conversationId,
        unreadCount: 0
      })
    },
    
    // 返回上一页
    navigateBack() {
      // 离开前标记所有消息为已读
      this.markAllMessagesAsRead()
      uni.navigateBack()
    },
    
    // 滚动事件
    onScroll(e) {
      // 可以在这里实现加载更多历史消息
    },
    
    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      
      if (isToday) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else {
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
    },
    
    // 格式化日期分隔符
    formatDateDivider() {
      const today = new Date()
      return `${today.getMonth() + 1}月${today.getDate()}日 今天`
    }
  }
}

</script>

<style scoped lang="scss">
.chat-container {
  height: 100vh;
  background-color: #F5F7FA;
  display: flex;
  flex-direction: column;
}

/* 聊天头部 */
.chat-header {
  background: #FFFFFF;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #EEEEEE;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-left, .header-right {
    width: 80rpx;
  }
  
  .back-icon {
    padding: 10rpx;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
        margin-bottom: 4rpx;
      }
      
      .role {
        font-size: 24rpx;
        color: #666666;
        margin-bottom: 4rpx;
      }
      
      .status {
        font-size: 22rpx;
        
        &.online {
          color: #4CD964;
        }
        
        &.offline {
          color: #999999;
        }
      }
    }
  }
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 20rpx 30rpx;
  
  .messages-wrapper {
    min-height: 100%;
  }
}

/* 日期分隔符 */
.date-divider {
  text-align: center;
  margin: 30rpx 0;
  
  text {
    background: #E8E8E8;
    color: #999999;
    font-size: 24rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
  }
}

.message-item {
  margin-bottom: 30rpx;
  
  &.own {
    .own-message {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      
      .message-content {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-right: 20rpx;
        max-width: 70%;
        
        .message-status {
          font-size: 20rpx;
          color: #999999;
          margin-bottom: 4rpx;
        }
        
        .message-time {
          font-size: 22rpx;
          color: #999999;
          margin-bottom: 8rpx;
        }
        
        .message-bubble {
          background: #4A90E2;
          border-radius: 20rpx 20rpx 4rpx 20rpx;
          padding: 20rpx 24rpx;
          position: relative;
          
          .message-text {
            font-size: 28rpx;
            color: #FFFFFF;
            line-height: 1.4;
          }
          
          .urgent-tag {
            position: absolute;
            top: -10rpx;
            right: 10rpx;
            background: #FF3B30;
            color: #FFFFFF;
            font-size: 18rpx;
            padding: 4rpx 8rpx;
            border-radius: 10rpx;
          }
        }
      }
      
      .message-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
      }
    }
  }
  
  &.other {
    .other-message {
      display: flex;
      align-items: flex-start;
      
      .message-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .message-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: 70%;
        
        .sender-name {
          font-size: 22rpx;
          color: #666666;
          margin-bottom: 8rpx;
        }
        
        .message-time {
          font-size: 22rpx;
          color: #999999;
          margin-bottom: 8rpx;
        }
        
        .message-bubble {
          background: #FFFFFF;
          border-radius: 20rpx 20rpx 20rpx 4rpx;
          padding: 20rpx 24rpx;
          box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
          position: relative;
          
          .message-text {
            font-size: 28rpx;
            color: #333333;
            line-height: 1.4;
          }
          
          .urgent-tag {
            position: absolute;
            top: -10rpx;
            left: 10rpx;
            background: #FF3B30;
            color: #FFFFFF;
            font-size: 18rpx;
            padding: 4rpx 8rpx;
            border-radius: 10rpx;
          }
        }
      }
    }
  }
}

/* 输入区域 */
.input-section {
  background: #FFFFFF;
  border-top: 1rpx solid #EEEEEE;
}

/* 快捷回复 */
.quick-replies {
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #F0F0F0;
  
  .quick-replies-scroll {
    white-space: nowrap;
  }
  
  .quick-reply-list {
    display: flex;
  }
  
  .quick-reply-item {
    background: #F8F9FA;
    border: 1rpx solid #E9ECEF;
    border-radius: 20rpx;
    padding: 12rpx 20rpx;
    margin-right: 16rpx;
    white-space: nowrap;
    
    text {
      font-size: 24rpx;
      color: #666666;
    }
    
    &:active {
      background: #E9ECEF;
    }
  }
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  
  .input-left, .input-right {
    display: flex;
    align-items: center;
  }
  
  .add-icon {
    padding: 10rpx;
  }
  
  .message-input {
    flex: 1;
    background: #F8F9FA;
    border: 2rpx solid #E9ECEF;
    border-radius: 20rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    max-height: 150rpx;
    min-height: 40rpx;
  }
  
  .text-count {
    font-size: 22rpx;
    color: #999999;
    margin-right: 16rpx;
  }
  
  .send-btn {
    background: #4A90E2;
    border: none;
    border-radius: 20rpx;
    padding: 16rpx 24rpx;
    min-width: 120rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .send-text {
      font-size: 28rpx;
      color: #FFFFFF;
      font-weight: 500;
    }
    
    &:disabled {
      background: #CCCCCC;
      
      .send-text {
        color: #999999;
      }
    }
  }
}

/* 更多操作 */
.more-actions {
  display: flex;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #F0F0F0;
  gap: 40rpx;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .action-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8rpx;
      font-size: 32rpx;
      
      &.urgent {
        background: #FFF2F2;
      }
      
      &.appointment {
        background: #F2F8FF;
      }
      
      &.summary {
        background: #F2FFF5;
      }
    }
    
    .action-text {
      font-size: 22rpx;
      color: #666666;
    }
  }
}
</style>