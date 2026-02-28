<template>
  <view class="ticket-detail-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-left" @click="handleBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">工单详情</text>
      <view class="nav-right">
        <text v-if="canExport" class="export-btn" @click="exportTicket">导出</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>

    <!-- 工单内容 -->
    <scroll-view v-else class="detail-content" scroll-y>
      <!-- 工单基本信息 -->
      <view class="basic-info-card">
        <view class="info-header">
          <text class="ticket-title">{{ ticketInfo.title }}</text>
          <view class="status-tag" :class="getStatusClass(ticketInfo.status)">
            <text>{{ getStatusText(ticketInfo.status) }}</text>
          </view>
        </view>

        <view class="info-content">
          <view class="info-item">
            <text class="label">工单编号：</text>
            <text class="value ticket-no">{{ ticketInfo.ticketNo || ticketInfo.id }}</text>
          </view>
          <view class="info-item">
            <text class="label">创建时间：</text>
            <text class="value">{{ formatTime(ticketInfo.createTime || ticketInfo.createdAt) }}</text>
          </view>
          <view class="info-item">
            <text class="label">问题类型：</text>
            <view class="category-tag">
              <text>{{ getCategoryText(ticketInfo.category) }}</text>
            </view>
          </view>
          <view class="info-item">
            <text class="label">紧急程度：</text>
            <view class="priority-tag" :class="ticketInfo.priority">
              <text>{{ getPriorityText(ticketInfo.priority) }}</text>
            </view>
          </view>
          <view v-if="ticketInfo.counselor" class="info-item">
            <text class="label">负责咨询师：</text>
            <view class="consultant-info">
              <text class="consultant-name">{{ ticketInfo.counselor.realName }}</text>
              <text v-if="ticketInfo.counselor.phone" class="consultant-phone">{{ ticketInfo.counselor.phone }}</text>
            </view>
          </view>
          <view v-if="ticketInfo.student && !ticketInfo.isAnonymous" class="info-item">
            <text class="label">学生信息：</text>
            <view class="student-info">
              <text class="student-name">{{ ticketInfo.student.realName }}</text>
              <text v-if="ticketInfo.student.className" class="student-class">{{ ticketInfo.student.className }}</text>
            </view>
          </view>
          <view v-if="ticketInfo.isAnonymous" class="info-item">
            <text class="label">学生信息：</text>
            <text class="anonymous-tag">匿名咨询</text>
          </view>
        </view>

        <!-- 问题描述 -->
        <view class="description-section">
          <text class="section-title">问题描述</text>
          <view class="description-content">
            <text>{{ ticketInfo.content || ticketInfo.description }}</text>
          </view>
        </view>
      </view>

      <!-- 状态时间线 -->
      <view v-if="statusLogs.length > 0" class="timeline-card">
        <text class="card-title">状态流转记录</text>
        <view class="timeline-container">
          <view v-for="(log, index) in statusLogs" :key="log.id || index" class="timeline-item">
            <view class="timeline-dot" :class="getLogStatusClass(log.toStatus)"></view>
            <view v-if="index < statusLogs.length - 1" class="timeline-line"></view>
            <view class="timeline-content">
              <view class="timeline-header">
                <text class="timeline-title">{{ getStatusText(log.toStatus) }}</text>
                <text class="timeline-time">{{ formatTime(log.createdAt) }}</text>
              </view>
              <view class="timeline-body">
                <text v-if="log.remark" class="timeline-remark">{{ log.remark }}</text>
                <text class="timeline-operator">
                  {{ log.operatorRole === 'student' ? '学生' : '咨询师' }}：{{ log.operatorName || '未知' }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 咨询记录 -->
      <view class="chat-record-card">
        <view class="card-header">
          <text class="card-title">咨询记录</text>
          <text v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</text>
        </view>

        <!-- 聊天消息列表 -->
        <view class="chat-messages" ref="messagesContainer">
          <!-- 加载更多 -->
          <view v-if="loadingMessages" class="loading-messages">
            <text>加载消息中...</text>
          </view>

          <!-- 消息列表 -->
          <view v-for="(message, index) in chatMessages" :key="message.id || index" class="message-item"
            :class="getMessageClass(message)">
            <view class="message-avatar">
              <text>{{ getAvatarText(message.senderRole, message.senderName) }}</text>
            </view>
            <view class="message-content">
              <view class="message-header">
                <text class="message-sender">{{ message.senderName }}</text>
                <text class="message-time">{{ formatRelativeTime(message.createdAt) }}</text>
              </view>
              <view class="message-body">
                <text v-if="message.messageType === 'text'" class="message-text">{{ message.content }}</text>
                <view v-else-if="message.messageType === 'image'" class="message-image"
                  @click="previewImage(message.content)">
                  <image :src="message.content" mode="aspectFit" class="image-preview"></image>
                </view>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="chatMessages.length === 0 && !loadingMessages" class="empty-messages">
            <text class="empty-icon">💬</text>
            <text class="empty-text">暂无咨询记录</text>
          </view>
        </view>

        <!-- 消息输入框（仅咨询中状态可见） -->
        <view v-if="ticketInfo.status === 'IN_PROGRESS' && (userRole === 'student' || userRole === 'counselor')"
          class="message-input-section">
          <view class="input-tools">
            <text class="tool-icon" @click="chooseImage">📷</text>
          </view>
          <input class="message-input" v-model="newMessage" placeholder="请输入消息..." :disabled="sendingMessage"
            @confirm="sendMessage" @focus="scrollToBottom" />
          <button class="send-btn" :disabled="!newMessage.trim() || sendingMessage" @click="sendMessage">
            {{ sendingMessage ? '发送中...' : '发送' }}
          </button>
        </view>
      </view>

      <!-- 评价信息 -->
      <view v-if="ticketInfo.rating" class="rating-card">
        <text class="card-title">评价信息</text>
        <view class="rating-content">
          <view class="rating-stars">
            <text v-for="n in 5" :key="n" class="star" :class="{ active: n <= ticketInfo.rating.score }">★</text>
          </view>
          <text class="rating-score">{{ ticketInfo.rating.score }}分</text>
          <text v-if="ticketInfo.rating.comment" class="rating-comment">{{ ticketInfo.rating.comment }}</text>
          <text class="rating-time">{{ formatTime(ticketInfo.rating.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 操作按钮 -->
    <view v-if="showActions && !loading" class="action-buttons">
      <button v-if="canAccept" class="action-btn primary" @click="handleAccept" :loading="accepting">
        受理工单
      </button>

      <button v-if="canStart" class="action-btn primary" @click="handleStart" :loading="starting">
        开始咨询
      </button>

      <button v-if="canComplete" class="action-btn success" @click="handleComplete" :loading="completing">
        完成咨询
      </button>

      <button v-if="canClose" class="action-btn warning" @click="handleClose" :loading="closing">
        关闭工单
      </button>

      <button v-if="canRate && !ticketInfo.rating" class="action-btn secondary" @click="showRating = true">
        评价咨询
      </button>

      <button v-if="canDelete" class="action-btn danger" @click="handleDelete" :loading="deleting">
        删除工单
      </button>
    </view>

    <!-- 评价弹窗 -->
    <uni-popup ref="ratingPopup" type="center">
      <view class="rating-popup">
        <view class="popup-header">
          <text class="popup-title">评价咨询</text>
          <text class="popup-close" @click="closeRating">×</text>
        </view>
        <view class="rating-content">
          <view class="rating-stars-section">
            <text class="rating-label">服务评分：</text>
            <view class="stars-selector">
              <text v-for="n in 5" :key="n" class="star-selector" :class="{ active: ratingForm.score >= n }"
                @click="ratingForm.score = n">
                ★
              </text>
            </view>
            <text class="rating-value">{{ ratingForm.score }}分</text>
          </view>
          <view class="comment-section">
            <text class="comment-label">评价内容：</text>
            <textarea v-model="ratingForm.comment" class="comment-textarea" placeholder="请输入您的评价内容（选填）" maxlength="500"
              :show-count="true" />
            <text class="comment-counter">{{ ratingForm.comment.length }}/500</text>
          </view>
        </view>
        <view class="popup-buttons">
          <button class="popup-btn cancel" @click="closeRating" :disabled="submittingRating">取消</button>
          <button class="popup-btn confirm" @click="submitRating" :loading="submittingRating">提交评价</button>
        </view>
      </view>
    </uni-popup>

    <!-- 图片预览 -->
    <uni-popup ref="imagePreview" type="center">
      <view class="image-preview-popup">
        <image :src="previewImageUrl" mode="aspectFit" class="preview-image"></image>
        <text class="preview-close" @click="closeImagePreview">×</text>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  // 修复导入路径 - 从正确的路径导入
  import {
    ticketApi,
    getStatusText,
    getPriorityText,
    getCategoryText,
    formatTime,
    formatRelativeTime,
    getStatusClass
  } from '@/api/ticketApi.js'

  export default {
    data() {
      return {
        ticketId: null,
        ticketInfo: {
          title: '',
          ticketNo: '',
          status: '',
          createTime: '',
          category: '',
          priority: 'MEDIUM',
          content: '',
          counselor: null,
          student: null,
          isAnonymous: false,
          rating: null
        },
        loading: false,

        // 状态记录
        statusLogs: [],

        // 聊天记录
        chatMessages: [],
        loadingMessages: false,
        unreadCount: 0,

        // 新消息
        newMessage: '',
        sendingMessage: false,

        // 操作状态
        accepting: false,
        starting: false,
        completing: false,
        closing: false,
        deleting: false,

        // 评价
        showRating: false,
        ratingForm: {
          score: 5,
          comment: ''
        },
        submittingRating: false,

        // 预览
        previewImageUrl: '',

        // 用户信息
        userRole: '',
        userId: '',
        userInfo: {},

        // 分页
        messagePage: 1,
        messagePageSize: 20,
        hasMoreMessages: true
      }
    },

    computed: {
      // 权限判断
      canAccept() {
        return this.userRole === 'counselor' &&
          this.ticketInfo.status === 'PENDING' &&
          (!this.ticketInfo.counselorId || this.ticketInfo.counselorId === this.userId)
      },

      canStart() {
        return this.userRole === 'counselor' &&
          this.ticketInfo.status === 'PENDING' &&
          this.ticketInfo.counselorId === this.userId
      },

      canComplete() {
        return this.userRole === 'counselor' &&
          this.ticketInfo.status === 'IN_PROGRESS' &&
          this.ticketInfo.counselorId === this.userId
      },

      canClose() {
        if (this.userRole === 'student') {
          return this.ticketInfo.status === 'PENDING' && this.ticketInfo.studentId === this.userId
        } else if (this.userRole === 'counselor') {
          return ['PENDING', 'IN_PROGRESS'].includes(this.ticketInfo.status) &&
            this.ticketInfo.counselorId === this.userId
        }
        return false
      },

      canRate() {
        return this.userRole === 'student' &&
          this.ticketInfo.status === 'COMPLETED' &&
          this.ticketInfo.studentId === this.userId
      },

      canDelete() {
        if (this.userRole === 'student') {
          return this.ticketInfo.studentId === this.userId && ['PENDING', 'CLOSED'].includes(this.ticketInfo.status)
        } else if (this.userRole === 'admin') {
          return true
        }
        return false
      },

      canExport() {
        return this.userRole === 'admin' ||
          (this.userRole === 'counselor' && this.ticketInfo.counselorId === this.userId) ||
          (this.userRole === 'student' && this.ticketInfo.studentId === this.userId)
      },

      showActions() {
        return this.canAccept || this.canStart || this.canComplete ||
          this.canClose || this.canRate || this.canDelete
      }
    },

    onLoad(options) {
      this.ticketId = options.id
      if (!this.ticketId) {
        uni.showToast({
          title: '工单ID无效',
          icon: 'error'
        })
        uni.navigateBack()
        return
      }

      this.loadUserInfo()
      this.loadTicketDetail()

      // 尝试加载附加数据，但不显示错误
      this.loadStatusLogs()
      this.loadChatMessages()

      // 监听消息更新
      uni.$on('new-message', this.handleNewMessage)
    },

    onUnload() {
      uni.$off('new-message', this.handleNewMessage)
    },

    onShow() {
      // 标记消息为已读
      this.markMessagesAsRead()
    },

    methods: {
      // 加载用户信息
      loadUserInfo() {
        try {
          const userInfo = uni.getStorageSync('userInfo')
          if (userInfo) {
            this.userRole = userInfo.role
            this.userId = userInfo.id
            this.userInfo = userInfo
          }
        } catch (error) {
          console.error('加载用户信息失败:', error)
        }
      },

      // 加载工单详情 - 核心方法
      async loadTicketDetail() {
        this.loading = true
        try {
          // GET 请求：http://localhost:8082/api/tickets/{id}
          const response = await ticketApi.getTicketDetail(this.ticketId)
          console.log('工单详情加载成功:', response)
          this.ticketInfo = response

          // 尝试从工单详情中提取状态日志
          if (response.statusLogs && Array.isArray(response.statusLogs)) {
            this.statusLogs = response.statusLogs
          }
        } catch (error) {
          console.error('加载工单详情失败:', error)
          uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
          })
        } finally {
          this.loading = false
        }
      },

      // 加载状态记录 - 静默失败
      async loadStatusLogs() {
        try {
          // 如果已经从工单详情中获取了状态记录，就不再请求
          if (this.statusLogs.length > 0) return

          const logs = await ticketApi.getTicketStatusLogs(this.ticketId)
          this.statusLogs = logs || []

          // 如果没有状态记录，创建一个默认的创建记录
          if (this.statusLogs.length === 0 && this.ticketInfo.createTime) {
            this.statusLogs = [{
              id: 1,
              toStatus: this.ticketInfo.status || 'PENDING',
              remark: '工单创建',
              operatorRole: 'student',
              operatorName: this.ticketInfo.student?.realName || '学生',
              createdAt: this.ticketInfo.createTime
            }]
          }
        } catch (error) {
          console.warn('加载状态记录失败（已静默处理）:', error.message)
          // 创建一个默认的创建记录
          if (this.ticketInfo.createTime) {
            this.statusLogs = [{
              id: 1,
              toStatus: this.ticketInfo.status || 'PENDING',
              remark: '工单创建',
              operatorRole: 'student',
              operatorName: this.ticketInfo.student?.realName || '学生',
              createdAt: this.ticketInfo.createTime
            }]
          }
        }
      },

      // 加载聊天记录 - 静默失败
      async loadChatMessages(isLoadMore = false) {
        if (this.loadingMessages || (!isLoadMore && !this.hasMoreMessages)) return

        this.loadingMessages = true
        try {
          const params = {
            page: this.messagePage,
            pageSize: this.messagePageSize
          }

          const data = await ticketApi.getTicketMessages(this.ticketId, params)
          const messages = data.list || []
          const total = data.total || 0

          if (isLoadMore) {
            this.chatMessages = [...messages.reverse(), ...this.chatMessages]
          } else {
            this.chatMessages = messages.reverse()
          }

          // 更新分页信息
          this.messagePage++
          this.hasMoreMessages = this.chatMessages.length < total

          // 滚动到底部
          // if (!isLoadMore) {
          //   this.$nextTick(() => {
          //     this.scrollToBottom()
          //   })
          // }

        } catch (error) {
          console.warn('加载聊天记录失败（已静默处理）:', error.message)
          this.chatMessages = []
          this.hasMoreMessages = false
        } finally {
          this.loadingMessages = false
        }
      },

      // 标记消息为已读
      async markMessagesAsRead() {
        try {
          // 找到未读消息
          const unreadMessages = this.chatMessages.filter(msg =>
            msg.senderId !== this.userId && !msg.readAt
          )

          for (const message of unreadMessages) {
            try {
              await ticketApi.markMessageAsRead(this.ticketId, message.id)
              message.readAt = new Date().toISOString()
            } catch (error) {
              console.warn('标记消息已读失败:', error.message)
            }
          }

          this.unreadCount = 0

        } catch (error) {
          console.warn('标记消息已读失败（已静默处理）:', error.message)
        }
      },

      // 发送消息
      async sendMessage() {
        if (!this.newMessage.trim() || this.sendingMessage) return

        this.sendingMessage = true
        try {
          const messageData = {
            content: this.newMessage.trim(),
            messageType: 'text',
            senderId: this.userId,
            senderRole: this.userRole,
            senderName: this.userInfo.realName || this.userInfo.username
          }

          await ticketApi.sendTicketMessage(this.ticketId, messageData)

          // 添加到本地列表
          const newMessage = {
            id: Date.now(),
            ...messageData,
            createdAt: new Date().toISOString(),
            readAt: null
          }

          this.chatMessages.push(newMessage)
          this.newMessage = ''

          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })

          // 触发全局事件
          uni.$emit('new-message', newMessage)

        } catch (error) {
          console.error('发送消息失败:', error)
          uni.showToast({
            title: error.message || '发送失败',
            icon: 'none'
          })
        } finally {
          this.sendingMessage = false
        }
      },

      // 选择图片
      async chooseImage() {
        try {
          const res = await uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera']
          })

          if (res.tempFilePaths.length > 0) {
            const filePath = res.tempFilePaths[0]
            await this.uploadAndSendFile(filePath, 'image')
          }

        } catch (error) {
          console.error('选择图片失败:', error)
        }
      },

      // 上传并发送图片
      async uploadAndSendFile(filePath, messageType) {
        try {
          uni.showLoading({
            title: '上传中...',
            mask: true
          })

          const uploadResult = await ticketApi.uploadAttachment(filePath, {
            formData: {
              ticketId: this.ticketId,
              messageType: messageType
            }
          })

          const messageData = {
            content: uploadResult.url,
            messageType: messageType,
            senderId: this.userId,
            senderRole: this.userRole,
            senderName: this.userInfo.realName || this.userInfo.username
          }

          await ticketApi.sendTicketMessage(this.ticketId, messageData)

          // 添加到本地列表
          const newMessage = {
            id: Date.now(),
            ...messageData,
            fileName: uploadResult.name,
            fileSize: uploadResult.size,
            createdAt: new Date().toISOString(),
            readAt: null
          }

          this.chatMessages.push(newMessage)

          this.$nextTick(() => {
            this.scrollToBottom()
          })

          uni.hideLoading()

        } catch (error) {
          console.error('上传图片失败:', error)
          uni.showToast({
            title: error.message || '上传失败',
            icon: 'none'
          })
        }
      },

      // 工单操作
      async handleAccept() {
        this.accepting = true
        try {
          await this.updateTicketStatus('IN_PROGRESS', '受理工单')
        } finally {
          this.accepting = false
        }
      },

      async handleStart() {
        this.starting = true
        try {
          await this.updateTicketStatus('IN_PROGRESS', '开始咨询')
        } finally {
          this.starting = false
        }
      },

      async handleComplete() {
        uni.showModal({
          title: '确认完成',
          content: '确定要标记为已完成吗？完成后学生可以对咨询进行评价。',
          success: async (res) => {
            if (res.confirm) {
              this.completing = true
              try {
                await this.updateTicketStatus('COMPLETED', '咨询完成')
              } finally {
                this.completing = false
              }
            }
          }
        })
      },

      async handleClose() {
        uni.showModal({
          title: '确认关闭',
          content: '确定要关闭此工单吗？关闭后无法再进行咨询。',
          success: async (res) => {
            if (res.confirm) {
              this.closing = true
              try {
                await this.updateTicketStatus('CLOSED', '关闭工单')
              } finally {
                this.closing = false
              }
            }
          }
        })
      },

      async handleDelete() {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除此工单吗？删除后不可恢复。',
          success: async (res) => {
            if (res.confirm) {
              this.deleting = true
              try {
                await ticketApi.deleteTicket(this.ticketId)

                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                })

                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)

              } catch (error) {
                console.error('删除工单失败:', error)
                uni.showToast({
                  title: error.message || '删除失败',
                  icon: 'none'
                })
              } finally {
                this.deleting = false
              }
            }
          }
        })
      },

      // 更新工单状态
      async updateTicketStatus(status, remark) {
        try {
          const data = {
            status: status,
            remark: remark,
            operatorId: this.userId,
            operatorRole: this.userRole
          }

          await ticketApi.updateTicketStatus(this.ticketId, data)

          uni.showToast({
            title: '操作成功',
            icon: 'success'
          })

          // 重新加载数据
          this.loadTicketDetail()
          this.loadStatusLogs()

        } catch (error) {
          console.error('更新工单状态失败:', error)
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          })
          throw error
        }
      },

      // 评价相关
      submitRating() {
        if (this.submittingRating) return

        this.submittingRating = true
        ticketApi.submitTicketRating(this.ticketId, this.ratingForm)
          .then(() => {
            uni.showToast({
              title: '评价成功',
              icon: 'success'
            })
            this.closeRating()
            this.loadTicketDetail()
          })
          .catch(error => {
            console.error('提交评价失败:', error)
            uni.showToast({
              title: error.message || '评价失败',
              icon: 'none'
            })
          })
          .finally(() => {
            this.submittingRating = false
          })
      },

      closeRating() {
        this.showRating = false
        this.ratingForm = {
          score: 5,
          comment: ''
        }
        this.$refs.ratingPopup.close()
      },

      // 导出工单
      async exportTicket() {
        try {
          uni.showLoading({
            title: '正在导出...',
            mask: true
          })

          const blob = await ticketApi.exportTickets({
            ticketIds: [this.ticketId],
            format: 'pdf'
          })

          // 创建下载链接
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `工单_${this.ticketInfo.ticketNo}_${Date.now()}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          uni.hideLoading()
          uni.showToast({
            title: '导出成功',
            icon: 'success'
          })

        } catch (error) {
          console.error('导出工单失败:', error)
          uni.showToast({
            title: error.message || '导出失败',
            icon: 'none'
          })
        }
      },

      // 工具函数
      getStatusText(status) {
        return getStatusText(status)
      },

      getStatusClass(status) {
        return getStatusClass(status)
      },

      getLogStatusClass(status) {
        const statusClass = {
          'PENDING': 'warning',
          'IN_PROGRESS': 'primary',
          'COMPLETED': 'success',
          'CLOSED': 'default'
        }
        return statusClass[status] || 'default'
      },

      getPriorityText(priority) {
        return getPriorityText(priority)
      },

      getCategoryText(category) {
        return getCategoryText(category)
      },

      formatTime(timestamp) {
        return formatTime(timestamp)
      },

      formatRelativeTime(timestamp) {
        return formatRelativeTime(timestamp)
      },

      getMessageClass(message) {
        return message.senderId === this.userId ? 'own' : 'other'
      },

      getAvatarText(role, name) {
        if (!name) return '?'
        return name.charAt(0).toUpperCase()
      },

      // 事件处理
      handleNewMessage(message) {
        if (message.ticketId === this.ticketId && message.senderId !== this.userId) {
          this.chatMessages.push(message)
          this.unreadCount++

          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }
      },

      scrollToBottom() {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this)
          query.select('.chat-messages').boundingClientRect()
          query.selectViewport().scrollOffset()
          query.exec((res) => {
            if (res[0]) {
              uni.pageScrollTo({
                scrollTop: res[0].bottom,
                duration: 300
              })
            }
          })
        }, 100)
      },

      closeImagePreview() {
        this.$refs.imagePreview.close()
        this.previewImageUrl = ''
      },

      handleBack() {
        uni.navigateBack()
      }
    }
  }
</script>

<style scoped lang="scss">
  /* 样式保持不变，使用原有的样式 */
  .ticket-detail-container {
    height: 100vh;
    background-color: #F5F7FA;
    display: flex;
    flex-direction: column;
  }

  .nav-header {
    height: 120rpx;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    border-bottom: 1rpx solid #EEEEEE;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-left {
    display: flex;
    align-items: center;
    color: #4A90E2;
    font-size: 28rpx;
  }

  .back-icon {
    font-size: 48rpx;
    margin-right: 10rpx;
  }

  .nav-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }

  .export-btn {
    color: #4A90E2;
    font-size: 28rpx;
    font-weight: 500;
    padding: 10rpx 20rpx;
  }

  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 6rpx solid #F3F3F3;
    border-top: 6rpx solid #4A90E2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 30rpx;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .detail-content {
    flex: 1;
    padding-bottom: 120rpx;
  }

  // 基本信息卡片
  .basic-info-card,
  .timeline-card,
  .chat-record-card,
  .rating-card {
    background: #FFFFFF;
    border-radius: 16rpx;
    margin: 20rpx 30rpx;
    padding: 30rpx;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30rpx;
  }

  .ticket-title {
    flex: 1;
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
    margin-right: 20rpx;
    line-height: 1.4;
  }

  .status-tag {
    padding: 12rpx 24rpx;
    border-radius: 24rpx;
    font-size: 26rpx;
    font-weight: 500;
    white-space: nowrap;
  }

  .status-tag.pending {
    background: #FFF3CD;
    color: #856404;
  }

  .status-tag.in_progress {
    background: #D1ECF1;
    color: #0C5460;
  }

  .status-tag.completed {
    background: #D4EDDA;
    color: #155724;
  }

  .status-tag.closed {
    background: #F8F9FA;
    color: #6C757D;
  }

  .info-content {
    margin-bottom: 30rpx;
  }

  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .info-item:last-child {
    margin-bottom: 0;
  }

  .label {
    font-size: 28rpx;
    color: #666666;
    min-width: 160rpx;
  }

  .value {
    font-size: 28rpx;
    color: #333333;
    flex: 1;
  }

  .ticket-no {
    font-family: 'Courier New', monospace;
    color: #999999;
  }

  .category-tag,
  .priority-tag {
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    font-size: 26rpx;
    font-weight: 500;
  }

  .category-tag {
    background: #E8F4FF;
    color: #4A90E2;
  }

  .priority-tag.LOW {
    background: #D4EDDA;
    color: #155724;
  }

  .priority-tag.MEDIUM {
    background: #FFF3CD;
    color: #856404;
  }

  .priority-tag.HIGH {
    background: #F8D7DA;
    color: #721C24;
  }

  .consultant-info,
  .student-info {
    display: flex;
    flex-direction: column;
  }

  .consultant-name,
  .student-name {
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
  }

  .consultant-phone,
  .student-class {
    font-size: 24rpx;
    color: #999999;
    margin-top: 4rpx;
  }

  .anonymous-tag {
    background: #F8F9FA;
    color: #999999;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    font-size: 26rpx;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
    display: block;
    margin-bottom: 20rpx;
    padding-bottom: 10rpx;
    border-bottom: 1rpx solid #F0F0F0;
  }

  .description-content {
    font-size: 28rpx;
    color: #333333;
    line-height: 1.6;
  }

  // 附件列表
  .attachments-list {
    margin-top: 20rpx;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #F8F9FA;
    border-radius: 12rpx;
    margin-bottom: 10rpx;
  }

  .attachment-item:last-child {
    margin-bottom: 0;
  }

  .attachment-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
  }

  .attachment-info {
    flex: 1;
  }

  .attachment-name {
    font-size: 26rpx;
    color: #333333;
    display: block;
    margin-bottom: 4rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attachment-size {
    font-size: 22rpx;
    color: #999999;
  }

  .download-icon {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: #4A90E2;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: bold;
    margin-left: 20rpx;
  }

  // 时间线
  .timeline-container {
    margin-top: 20rpx;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 30rpx;
    position: relative;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-dot {
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    background: #4A90E2;
    position: relative;
    z-index: 2;
  }

  .timeline-dot.warning {
    background: #FF9500;
  }

  .timeline-dot.primary {
    background: #4A90E2;
  }

  .timeline-dot.success {
    background: #09BB07;
  }

  .timeline-dot.default {
    background: #999999;
  }

  .timeline-line {
    position: absolute;
    left: 12rpx;
    top: 24rpx;
    bottom: -30rpx;
    width: 2rpx;
    background: #E0E0E0;
    z-index: 1;
  }

  .timeline-content {
    flex: 1;
    margin-left: 30rpx;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
  }

  .timeline-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333333;
  }

  .timeline-time {
    font-size: 24rpx;
    color: #999999;
  }

  .timeline-body {
    font-size: 26rpx;
    color: #666666;
    line-height: 1.5;
  }

  .timeline-remark {
    display: block;
    margin-bottom: 5rpx;
    color: #333333;
  }

  .timeline-operator {
    color: #999999;
    font-size: 24rpx;
  }

  // 聊天记录
  .chat-record-card {
    margin-bottom: 40rpx;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .unread-badge {
    background: #FF3B30;
    color: #FFFFFF;
    font-size: 24rpx;
    min-width: 40rpx;
    height: 40rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 10rpx;
  }

  .chat-messages {
    min-height: 200rpx;
    max-height: 500rpx;
    overflow-y: auto;
    padding: 20rpx 0;
  }

  .loading-messages {
    text-align: center;
    padding: 20rpx;
    color: #999999;
    font-size: 26rpx;
  }

  .message-item {
    display: flex;
    margin-bottom: 30rpx;
  }

  .message-item.own {
    flex-direction: row-reverse;
  }

  .message-item.own .message-content {
    margin-right: 20rpx;
    margin-left: 0;
    align-items: flex-end;
  }

  .message-item.other .message-content {
    margin-left: 20rpx;
    margin-right: 0;
    align-items: flex-start;
  }

  .message-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #4A90E2;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: bold;
    flex-shrink: 0;
  }

  .message-item.other .message-avatar {
    background: #FF9500;
  }

  .message-content {
    flex: 1;
    max-width: 70%;
    display: flex;
    flex-direction: column;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
  }

  .message-sender {
    font-size: 24rpx;
    color: #666666;
  }

  .message-time {
    font-size: 22rpx;
    color: #999999;
  }

  .message-body {
    background: #F8F9FA;
    border-radius: 16rpx;
    padding: 20rpx;
  }

  .message-item.own .message-body {
    background: #E8F4FF;
  }

  .message-text {
    font-size: 28rpx;
    color: #333333;
    line-height: 1.5;
  }

  .message-image {
    width: 200rpx;
    height: 200rpx;
  }

  .image-preview {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
  }

  .message-file {
    display: flex;
    align-items: center;
    padding: 15rpx;
    background: #FFFFFF;
    border-radius: 8rpx;
    border: 1rpx solid #E0E0E0;
  }

  .file-icon {
    font-size: 32rpx;
    margin-right: 15rpx;
  }

  .file-name {
    font-size: 26rpx;
    color: #333333;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 0;
  }

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 26rpx;
    color: #999999;
  }

  // 消息输入框
  .message-input-section {
    display: flex;
    align-items: center;
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #F0F0F0;
  }

  .input-tools {
    display: flex;
    gap: 20rpx;
    margin-right: 20rpx;
  }

  .tool-icon {
    font-size: 36rpx;
    color: #666666;
    padding: 10rpx;
  }

  .message-input {
    flex: 1;
    height: 80rpx;
    background: #F8F9FA;
    border: 2rpx solid #E0E0E0;
    border-radius: 40rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }

  .send-btn {
    margin-left: 20rpx;
    background: #4A90E2;
    color: #FFFFFF;
    border: none;
    border-radius: 40rpx;
    padding: 0 40rpx;
    height: 80rpx;
    font-size: 28rpx;
    font-weight: 500;
    white-space: nowrap;
  }

  .send-btn:disabled {
    background: #CCCCCC;
    color: #999999;
  }

  // 评价卡片
  .rating-content {
    margin-top: 20rpx;
  }

  .rating-stars {
    display: flex;
    gap: 10rpx;
    margin-bottom: 15rpx;
  }

  .star {
    font-size: 36rpx;
    color: #CCCCCC;
  }

  .star.active {
    color: #FFC107;
  }

  .rating-score {
    font-size: 32rpx;
    color: #FF9500;
    font-weight: bold;
    margin-bottom: 15rpx;
    display: block;
  }

  .rating-comment {
    font-size: 28rpx;
    color: #333333;
    line-height: 1.6;
    margin-bottom: 15rpx;
    display: block;
  }

  .rating-time {
    font-size: 24rpx;
    color: #999999;
    display: block;
  }

  // 操作按钮
  .action-buttons {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    border-top: 1rpx solid #EEEEEE;
    display: flex;
    gap: 15rpx;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 150rpx;
    height: 80rpx;
    border: none;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
    white-space: nowrap;
  }

  .action-btn.primary {
    background: #4A90E2;
    color: #FFFFFF;
  }

  .action-btn.success {
    background: #09BB07;
    color: #FFFFFF;
  }

  .action-btn.warning {
    background: #FF9500;
    color: #FFFFFF;
  }

  .action-btn.secondary {
    background: #FFFFFF;
    color: #4A90E2;
    border: 2rpx solid #4A90E2;
  }

  .action-btn.danger {
    background: #FF3B30;
    color: #FFFFFF;
  }

  // 评价弹窗
  .rating-popup {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 40rpx;
    width: 600rpx;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
  }

  .popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .popup-close {
    font-size: 40rpx;
    color: #999999;
    padding: 10rpx;
  }

  .rating-content {
    margin-bottom: 40rpx;
  }

  .rating-stars-section {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
  }

  .rating-label {
    font-size: 28rpx;
    color: #333333;
    margin-right: 20rpx;
  }

  .stars-selector {
    display: flex;
    gap: 15rpx;
    margin-right: 20rpx;
  }

  .star-selector {
    font-size: 44rpx;
    color: #CCCCCC;
    cursor: pointer;
    transition: color 0.3s;
  }

  .star-selector.active {
    color: #FFC107;
  }

  .rating-value {
    font-size: 32rpx;
    color: #FF9500;
    font-weight: bold;
  }

  .comment-section {
    position: relative;
  }

  .comment-label {
    font-size: 28rpx;
    color: #333333;
    display: block;
    margin-bottom: 15rpx;
  }

  .comment-textarea {
    width: 100%;
    height: 200rpx;
    background: #F8F9FA;
    border: 2rpx solid #E0E0E0;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    margin-bottom: 10rpx;
  }

  .comment-counter {
    font-size: 24rpx;
    color: #999999;
    text-align: right;
    display: block;
  }

  .popup-buttons {
    display: flex;
    gap: 20rpx;
  }

  .popup-btn {
    flex: 1;
    height: 80rpx;
    border: none;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 500;
  }

  .popup-btn.cancel {
    background: #F8F9FA;
    color: #666666;
  }

  .popup-btn.confirm {
    background: #4A90E2;
    color: #FFFFFF;
  }

  .popup-btn:disabled {
    opacity: 0.5;
  }

  // 图片预览弹窗
  .image-preview-popup {
    position: relative;
    background: #000000;
    border-radius: 8rpx;
    overflow: hidden;
  }

  .preview-image {
    width: 600rpx;
    height: 600rpx;
  }

  .preview-close {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    font-weight: bold;
  }
</style>