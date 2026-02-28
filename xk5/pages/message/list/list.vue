<template>
  <view class="page-container">
    <!-- 学生端头部 -->
    <view v-if="userRole === 'student'" class="header-section">
      <!-- 搜索框 -->
      <view class="search-section">
        <input v-model="searchKeyword" placeholder="搜索咨询师" class="search-input" @confirm="handleSearch" />
      </view>
    </view>

    <!-- 咨询师端头部 -->
    <view v-else-if="userRole === 'consultant'" class="header-section">
      <!-- 顶部筛选栏 -->
      <view class="filter-section">
        <view class="filter-tabs">
          <view v-for="tab in tabs" :key="tab.id" :class="['tab-item', { active: activeTab === tab.id }]"
            @click="switchTab(tab.id)">
            <text>{{ tab.name }}</text>
            <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
          </view>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-section">
        <view class="search-input-container">
          <text class="search-icon">🔍</text>
          <input v-model="searchKeyword" placeholder="搜索学生姓名、班级或咨询问题" class="search-input" @input="handleSearch" />
          <view v-if="searchKeyword" class="clear-icon" @click="clearSearch">
            <text>✕</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 管理员端头部 -->
    <view v-else-if="userRole === 'admin'" class="header-section">
      <!-- 管理员顶部统计 -->
      <view class="admin-stats">
        <view class="stat-card">
          <text class="stat-number">{{ stats.totalConsultants }}</text>
          <text class="stat-label">咨询师</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">{{ stats.totalStudents }}</text>
          <text class="stat-label">学生用户</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">{{ stats.activeSessions }}</text>
          <text class="stat-label">进行中咨询</text>
        </view>
      </view>
    </view>

    <!-- 主内容滚动区域 - 始终存在，解决 scrollTop 错误 -->
    <scroll-view class="message-list" scroll-y refresher-enabled :refresher-triggered="refreshing"
      @refresherrefresh="onPullDownRefresh">
      
      <!-- 学生端内容 -->
      <view v-if="userRole === 'student'">
        <view class="conversation-list">
          <uni-swipe-action>
            <uni-swipe-action-item v-for="conversation in filteredConversations" :key="conversation.id"
              :right-options="swipeOptions" @click="handleSwipeClick($event, conversation)">
              <view class="conversation-item" @click="navigateToChat(conversation)">
                <view class="avatar-container">
                  <image :src="conversation.avatar" class="avatar" />
                  <view v-if="conversation.status === 'online'" class="online-indicator"></view>
                </view>
                <view class="conversation-content">
                  <view class="conversation-header">
                    <text class="conversation-name">{{ conversation.name }}</text>
                    <text class="conversation-time">{{ formatRelativeTime(conversation.lastTime) }}</text>
                  </view>
                  <text class="conversation-message">{{ conversation.lastMessage }}</text>
                  <view class="consultant-tags">
                    <view v-for="tag in conversation.tags" :key="tag" class="tag">
                      {{ tag }}
                    </view>
                  </view>
                </view>
                <view v-if="conversation.unreadCount > 0" class="unread-badge">
                  <text>{{ conversation.unreadCount }}</text>
                </view>
              </view>
            </uni-swipe-action-item>
          </uni-swipe-action>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredConversations.length === 0" class="empty-state">
          <text class="empty-icon">💬</text>
          <text class="empty-text">暂无咨询对话</text>
          <button class="find-consultant-btn" @click="navigateToConsultants">
            寻找咨询师
          </button>
        </view>
      </view>

      <!-- 咨询师端内容 -->
      <view v-else-if="userRole === 'consultant'">
        <!-- 今日咨询提醒 -->
        <view v-if="todayAppointments.length > 0" class="today-reminder">
          <view class="reminder-header">
            <text class="reminder-icon">📅</text>
            <text class="reminder-title">今日咨询安排</text>
          </view>
          <scroll-view class="appointment-scroll" scroll-x>
            <view class="appointment-list">
              <view v-for="appointment in todayAppointments" :key="appointment.id" class="appointment-item"
                @click="viewAppointmentDetail(appointment)">
                <view class="appointment-time">{{ appointment.time }}</view>
                <view class="appointment-name">{{ appointment.studentName }}</view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 学生列表 -->
        <view class="student-list">
          <view v-for="student in filteredStudents" :key="student.id" class="student-item"
            @click="navigateToChat(student)">
            <view class="student-avatar-container">
              <image :src="student.avatar" class="avatar" />
              <view v-if="student.status === 'online'" class="online-indicator"></view>
            </view>

            <view class="student-content">
              <view class="student-header">
                <text class="student-name">{{ student.name }}</text>
                <view class="student-meta">
                  <text class="student-class">{{ student.className }}</text>
                  <text class="student-time">{{ formatRelativeTime(student.lastTime) }}</text>
                </view>
              </view>

              <view class="student-message">
                <text class="message-preview">{{ student.lastMessage }}</text>
                <view v-if="student.consultType" :class="['consult-tag', student.consultType]">
                  {{ getConsultTypeText(student.consultType) }}
                </view>
              </view>

              <view class="student-tags">
                <view v-for="tag in student.tags" :key="tag" class="tag">
                  {{ tag }}
                </view>
              </view>
            </view>

            <view class="student-actions">
              <view v-if="student.unreadCount > 0" class="unread-badge">
                <text>{{ student.unreadCount }}</text>
              </view>
              <view v-if="student.hasUrgent && activeTab === 'all'" class="urgent-indicator"
                @click.stop="handleUrgent(student)">
                <text class="urgent-icon">⚠️</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredStudents.length === 0" class="empty-state">
          <text class="empty-icon">💬</text>
          <text class="empty-text">{{ emptyText }}</text>
          <button v-if="activeTab === 'all'" class="empty-action" @click="goToSchedule">
            查看咨询安排
          </button>
        </view>
      </view>

      <!-- 管理员端内容 -->
      <view v-else-if="userRole === 'admin'">
        <!-- 系统消息 -->
        <view class="system-messages">
          <view class="section-header">
            <text class="section-title">系统消息</text>
            <text class="section-more" @click="viewAllSystemMessages">查看全部</text>
          </view>

          <view class="system-message-list">
            <view v-for="message in systemMessages" :key="message.id" class="system-message-item"
              @click="viewSystemMessage(message)">
              <view class="message-icon" :class="message.type">
                <text class="icon-text">{{ getSystemMessageIcon(message.type) }}</text>
              </view>
              <view class="message-content">
                <text class="message-title">{{ message.title }}</text>
                <text class="message-desc">{{ message.description }}</text>
                <text class="message-time">{{ formatRelativeTime(message.time) }}</text>
              </view>
              <view v-if="!message.read" class="unread-dot"></view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="systemMessages.length === 0" class="empty-state">
          <text class="empty-icon">📊</text>
          <text class="empty-text">暂无系统消息</text>
          <text class="empty-desc">系统消息将在这里显示</text>
        </view>
      </view>

    </scroll-view>
  </view>
</template>

<script>
  import { mapState, mapActions } from 'vuex'

  export default {
    data() {
      return {
        userRole: 'student',
        // 学生端数据
        searchKeyword: '',
        refreshing: false,
        swipeOptions: [
          {
            text: '删除',
            style: {
              backgroundColor: '#dd524d'
            }
          }
        ],
        // conversations: [], // Use store

        // 咨询师端数据
        activeTab: 'all',
        tabs: [{
            id: 'all',
            name: '全部',
            count: 0
          },
          {
            id: 'unread',
            name: '未读',
            count: 0
          },
          {
            id: 'urgent',
            name: '紧急',
            count: 0
          },
          {
            id: 'reserved',
            name: '已预约',
            count: 0
          }
        ],
        todayAppointments: [],
        students: [], // Maybe also use store if we want

        // 管理员端数据
        stats: {
          totalConsultants: 0,
          totalStudents: 0,
          activeSessions: 0
        },
        systemMessages: []
      }
    },

    computed: {
      ...mapState('chat', {
        conversations: state => state.conversations
      }),
      // 学生端计算属性
      filteredConversations() {
        if (!this.searchKeyword) {
          return this.conversations
        }
        return this.conversations.filter(conv =>
          conv.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(this.searchKeyword.toLowerCase())
        )
      },

      // 咨询师端计算属性
      filteredStudents() {
        // If we use store for students too, update this. For now let's keep it local or mixed
        let filtered = this.students

        // 根据标签筛选
        if (this.activeTab === 'unread') {
          filtered = filtered.filter(student => student.unreadCount > 0)
        } else if (this.activeTab === 'urgent') {
          filtered = filtered.filter(student => student.hasUrgent)
        } else if (this.activeTab === 'reserved') {
          filtered = filtered.filter(student => student.hasAppointment)
        }

        // 根据搜索关键词筛选
        if (this.searchKeyword) {
          const keyword = this.searchKeyword.toLowerCase()
          filtered = filtered.filter(student =>
            student.name.toLowerCase().includes(keyword) ||
            (student.className && student.className.toLowerCase().includes(keyword)) ||
            student.lastMessage.toLowerCase().includes(keyword)
          )
        }

        return filtered
      },

      emptyText() {
        if (this.searchKeyword) {
          return '没有找到相关内容'
        }

        switch (this.activeTab) {
          case 'unread':
            return '暂无未读消息'
          case 'urgent':
            return '暂无紧急咨询'
          case 'reserved':
            return '暂无预约咨询'
          default:
            return this.userRole === 'student' ? '暂无咨询对话' : '暂无咨询记录'
        }
      }
    },

    onLoad(options) {
      console.log('消息列表页面加载')
      this.loadUserInfo()
      this.loadDataByRole()
    },

    onShow() {
      // 页面显示时刷新数据
      this.loadUserInfo()
      this.loadDataByRole()
    },

    onPullDownRefresh() {
      this.onPullDownRefreshHandler().then(() => {
        uni.stopPullDownRefresh()
      })
    },

    methods: {
      ...mapActions('chat', ['getConversationList', 'deleteConversation']),

      handleSwipeClick(e, conversation) {
        if (e.content.text === '删除') {
          uni.showModal({
            title: '提示',
            content: '确定删除该对话吗？',
            success: (res) => {
              if (res.confirm) {
                this.deleteConversation(conversation.id)
                uni.showToast({
                  title: '已删除',
                  icon: 'none'
                })
              }
            }
          })
        }
      },

      // 加载用户信息 - 修复角色获取逻辑
      loadUserInfo() {
        try {
          const storedUserInfo = uni.getStorageSync('userInfo')
          console.log('从存储获取的用户信息:', storedUserInfo)

          if (storedUserInfo) {
            // 【关键修复】按优先级获取角色
            let role = null

            // 优先级 1: 后端返回的loginRole
            if (storedUserInfo.loginRole) {
              role = storedUserInfo.loginRole
              console.log('使用loginRole:', role)
            }
            // 优先级 2: 前端确定的determinedRole
            else if (storedUserInfo.determinedRole) {
              role = storedUserInfo.determinedRole
              console.log('使用determinedRole:', role)
            }
            // 优先级 3: 用户对象中的role（数据库角色）
            else if (storedUserInfo.user && storedUserInfo.user.role) {
              role = storedUserInfo.user.role
              console.log('使用user.role:', role)
            }
            // 默认值
            else {
              role = 'student'
              console.log('使用默认角色: student')
            }

            this.userRole = this.normalizeRole(role)
            console.log('设置用户角色为:', this.userRole)
          } else {
            console.log('未找到用户信息，使用默认角色: student')
            this.userRole = 'student'
          }
        } catch (e) {
          console.error('获取用户信息失败:', e)
          this.userRole = 'student'
        }
      },

      // 标准化角色值
      normalizeRole(role) {
        if (!role) return 'student'

        const roleMap = {
          'student': 'student',
          'consultant': 'consultant',
          'admin': 'admin',
          'STUDENT': 'student',
          'CONSULTANT': 'consultant',
          'ADMIN': 'admin'
        }

        return roleMap[role] || 'student'
      },

      // 根据角色加载数据
      loadDataByRole() {
        console.log('根据角色加载数据:', this.userRole)
        switch (this.userRole) {
          case 'student':
            this.loadStudentConversations()
            break
          case 'consultant':
            this.loadConsultantStudents()
            break
          case 'admin':
            this.loadAdminData()
            break
          default:
            this.loadStudentConversations()
        }
      },

      // 学生端数据加载
      loadStudentConversations() {
        console.log('加载学生端对话数据')
        this.getConversationList()
      },

      // 咨询师端数据加载
      loadConsultantStudents() {
        console.log('加载咨询师端学生数据')
        // 模拟咨询师端学生数据 (Keeping mock for consultant for now as store only has conversations list)
        this.students = [{
            id: 1,
            name: '张三',
            avatar: '/static/images/avatars/student1.jpg',
            className: '高三(2)班',
            lastMessage: '老师，我最近压力很大，晚上总是失眠',
            lastTime: Date.now() - 3600000 * 2,
            unreadCount: 2,
            consultType: 'urgent',
            hasUrgent: true,
            hasAppointment: true,
            status: 'online',
            tags: ['焦虑', '失眠', '高三']
          },
          {
            id: 2,
            name: '李四',
            avatar: '/static/images/avatars/student2.jpg',
            className: '高二(5)班',
            lastMessage: '谢谢老师的建议，我会尝试一下',
            lastTime: Date.now() - 86400000 * 1,
            unreadCount: 0,
            consultType: 'normal',
            hasUrgent: false,
            hasAppointment: false,
            status: 'offline',
            tags: ['人际关系', '适应问题']
          }
        ]

        // 更新今日预约
        this.todayAppointments = [{
            id: 1,
            time: '10:00',
            studentName: '张三'
          },
          {
            id: 2,
            time: '14:30',
            studentName: '李四'
          }
        ]

        // 更新标签计数
        this.updateTabCounts()
      },

      // 管理员端数据加载
      loadAdminData() {
        console.log('加载管理员端数据')
        // 模拟管理员数据
        this.stats = {
          totalConsultants: 24,
          totalStudents: 1560,
          activeSessions: 18
        }

        this.systemMessages = [{
            id: 1,
            type: 'notification',
            title: '系统维护通知',
            description: '本周末系统将进行维护，期间服务可能短暂中断',
            time: Date.now() - 3600000 * 5,
            read: false
          },
          {
            id: 2,
            type: 'warning',
            title: '咨询师认证提醒',
            description: '有3位咨询师的认证即将到期，请及时处理',
            time: Date.now() - 86400000 * 1,
            read: true
          }
        ]
      },

      updateTabCounts() {
        this.tabs[0].count = this.students.length
        this.tabs[1].count = this.students.filter(s => s.unreadCount > 0).length
        this.tabs[2].count = this.students.filter(s => s.hasUrgent).length
        this.tabs[3].count = this.students.filter(s => s.hasAppointment).length
      },

      async onPullDownRefreshHandler() {
        this.refreshing = true
        await this.loadDataByRole()
        this.refreshing = false
      },

      // 通用方法
      handleSearch() {
        console.log('搜索关键词:', this.searchKeyword)
      },

      clearSearch() {
        this.searchKeyword = ''
      },

      navigateToChat(conversation) {
        let url = ''
        if (this.userRole === 'student') {
          url = `/pages/message/chat/chat?consultantId=${conversation.id}&name=${conversation.name}`
        } else if (this.userRole === 'consultant') {
          url = `/pages/message/chat/chat?studentId=${conversation.id}&name=${conversation.name}&role=consultant`
        }

        if (url) {
          uni.navigateTo({
            url: url
          })
        }
      },

      navigateToConsultants() {
        uni.navigateTo({
          url: '/pages/consultant/list/list'
        })
      },

      // 咨询师端方法
      switchTab(tabId) {
        this.activeTab = tabId
      },

      viewAppointmentDetail(appointment) {
        uni.showToast({
          title: `查看${appointment.studentName}的预约详情`,
          icon: 'none'
        })
      },

      handleUrgent(student) {
        uni.showModal({
          title: '紧急咨询',
          content: `学生 ${student.name} 标记了紧急咨询，是否立即处理？`,
          confirmText: '立即处理',
          success: (res) => {
            if (res.confirm) {
              this.navigateToChat(student)
            }
          }
        })
      },

      goToSchedule() {
        uni.showToast({
          title: '跳转到咨询安排页面',
          icon: 'none'
        })
      },

      // 管理员端方法
      viewSystemMessage(message) {
        uni.showToast({
          title: `查看系统消息: ${message.title}`,
          icon: 'none'
        })
      },

      viewAllSystemMessages() {
        uni.showToast({
          title: '查看所有系统消息',
          icon: 'none'
        })
      },

      getSystemMessageIcon(type) {
        const iconMap = {
          'notification': '📢',
          'warning': '⚠️',
          'info': 'ℹ️'
        }
        return iconMap[type] || '📋'
      },

      // 通用方法
      formatRelativeTime(timestamp) {
        if (!timestamp) return ''
        const now = new Date()
        const date = new Date(timestamp)
        const diff = now.getTime() - date.getTime()

        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        if (hours < 24) return `${hours}小时前`
        if (days < 7) return `${days}天前`

        return `${date.getMonth() + 1}-${date.getDate()}`
      },

      getConsultTypeText(type) {
        const typeMap = {
          'urgent': '紧急',
          'normal': '普通',
          'scheduled': '已预约',
          'followup': '跟进'
        }
        return typeMap[type] || '咨询'
      }
    }
  }
</script>

<style scoped lang="scss">
  /* 学生端样式 */
  .message-list-container {
    height: 100vh;
    background-color: #F5F7FA;
    display: flex;
    flex-direction: column;
  }

  .search-section {
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #EEEEEE;
  }

  .search-input {
    width: 100%;
    height: 72rpx;
    background: #F8F9FA;
    border: 2rpx solid #E9ECEF;
    border-radius: 36rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }

  .message-list {
    flex: 1;
  }

  .conversation-list {
    background: transparent;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    padding: 24rpx 30rpx;
    background: #FFFFFF;
    border-bottom: 1rpx solid #F0F0F0;
    position: relative;
  }

  .avatar-container {
    position: relative;
    margin-right: 24rpx;
  }

  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20rpx;
    height: 20rpx;
    background: #4CD964;
    border: 2rpx solid #FFFFFF;
    border-radius: 50%;
  }

  .conversation-content {
    flex: 1;
  }

  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
  }

  .conversation-name {
    font-size: 32rpx;
    color: #333333;
    font-weight: 500;
  }

  .conversation-time {
    font-size: 24rpx;
    color: #999999;
  }

  .conversation-message {
    font-size: 28rpx;
    color: #666666;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8rpx;
  }

  .consultant-tags {
    display: flex;
    flex-wrap: wrap;
  }

  .tag {
    background: #F2F2F7;
    color: #666;
    padding: 4rpx 12rpx;
    border-radius: 16rpx;
    font-size: 20rpx;
    margin-right: 8rpx;
    margin-bottom: 4rpx;
  }

  .unread-badge {
    background: #FF3B30;
    color: #FFFFFF;
    border-radius: 20rpx;
    min-width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: 500;
  }

  .find-consultant-btn {
    background: #4A90E2;
    color: #FFFFFF;
    border-radius: 40rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    margin-top: 30rpx;
    border: none;
  }

  /* 咨询师端样式 */
  .consultant-message-list-container {
    height: 100vh;
    background-color: #F5F7FA;
    display: flex;
    flex-direction: column;
  }

  /* 筛选栏样式 */
  .filter-section {
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #EEEEEE;
  }

  .filter-tabs {
    display: flex;
  }

  .tab-item {
    position: relative;
    padding: 12rpx 24rpx;
    margin-right: 20rpx;
    font-size: 28rpx;
    color: #666;
    border-radius: 30rpx;
    transition: all 0.3s;

    &.active {
      background: #4A90E2;
      color: #FFFFFF;
    }
  }

  .tab-badge {
    position: absolute;
    top: -10rpx;
    right: 0;
    background: #FF3B30;
    color: #FFFFFF;
    border-radius: 20rpx;
    min-width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: 500;
  }

  /* 搜索框样式 */
  .search-input-container {
    position: relative;
    display: flex;
    align-items: center;
    background: #F8F9FA;
    border-radius: 36rpx;
    padding: 0 30rpx;
    height: 72rpx;
  }

  .search-icon {
    margin-right: 16rpx;
    font-size: 28rpx;
    color: #999;
  }

  .clear-icon {
    padding: 10rpx;
    color: #999;
  }

  /* 今日咨询提醒 */
  .today-reminder {
    background: #FFF9F2;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #FFE8D6;
  }

  .reminder-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .reminder-icon {
    margin-right: 10rpx;
    font-size: 28rpx;
  }

  .reminder-title {
    font-size: 28rpx;
    color: #FF6B35;
    font-weight: 500;
  }

  .appointment-scroll {
    white-space: nowrap;
  }

  .appointment-list {
    display: flex;
  }

  .appointment-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background: #FFFFFF;
    border: 1rpx solid #FFE8D6;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-right: 20rpx;
    min-width: 120rpx;
  }

  .appointment-time {
    font-size: 24rpx;
    color: #FF6B35;
    font-weight: 500;
    margin-bottom: 10rpx;
  }

  .appointment-name {
    font-size: 24rpx;
    color: #666;
  }

  /* 学生列表样式 */
  .student-list {
    background: transparent;
  }

  .student-item {
    display: flex;
    align-items: flex-start;
    padding: 30rpx;
    background: #FFFFFF;
    border-bottom: 1rpx solid #F0F0F0;
    position: relative;
  }

  .student-avatar-container {
    position: relative;
    margin-right: 24rpx;
  }

  .student-content {
    flex: 1;
  }

  .student-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12rpx;
  }

  .student-name {
    font-size: 32rpx;
    color: #333333;
    font-weight: 500;
  }

  .student-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .student-class {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 6rpx;
  }

  .student-time {
    font-size: 22rpx;
    color: #999;
  }

  .student-message {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .message-preview {
    flex: 1;
    font-size: 28rpx;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 16rpx;
  }

  .consult-tag {
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    color: #FFFFFF;

    &.urgent {
      background: #FF3B30;
    }

    &.normal {
      background: #4A90E2;
    }

    &.scheduled {
      background: #34C759;
    }

    &.followup {
      background: #AF52DE;
    }
  }

  .student-tags {
    display: flex;
    flex-wrap: wrap;
  }

  .student-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 20rpx;
  }

  .urgent-indicator {
    background: #FFF2F2;
    border-radius: 50%;
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10rpx;
  }

  .urgent-icon {
    font-size: 24rpx;
  }

  /* 管理员端样式 */
  .admin-message-list-container {
    height: 100vh;
    background-color: #F5F7FA;
    padding: 30rpx;
  }

  .admin-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40rpx;
  }

  .stat-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 30rpx 20rpx;
    text-align: center;
    margin: 0 10rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }

  .stat-number {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #4A90E2;
    margin-bottom: 10rpx;
  }

  .stat-label {
    font-size: 24rpx;
    color: #666;
  }

  .system-messages {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
  }

  .section-title {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }

  .section-more {
    font-size: 26rpx;
    color: #4A90E2;
  }

  .system-message-item {
    display: flex;
    align-items: flex-start;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
    position: relative;
  }

  .system-message-item:last-child {
    border-bottom: none;
  }

  .message-icon {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    &.notification {
      background: #4A90E2;
    }

    &.warning {
      background: #FF9500;
    }

    &.info {
      background: #34C759;
    }
  }

  .icon-text {
    font-size: 24rpx;
    color: #fff;
  }

  .message-content {
    flex: 1;
  }

  .message-title {
    display: block;
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 8rpx;
  }

  .message-desc {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 8rpx;
  }

  .message-time {
    font-size: 22rpx;
    color: #999;
  }

  .unread-dot {
    width: 16rpx;
    height: 16rpx;
    background: #FF3B30;
    border-radius: 50%;
    position: absolute;
    right: 0;
    top: 40rpx;
  }

  /* 通用空状态样式 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
    text-align: center;
  }

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 40rpx;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999999;
    margin-bottom: 20rpx;
  }

  .empty-desc {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 40rpx;
  }

  .empty-action {
    background: #4A90E2;
    color: #FFFFFF;
    border-radius: 40rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    border: none;
  }
</style>