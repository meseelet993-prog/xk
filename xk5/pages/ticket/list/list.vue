<template>
  <view class="ticket-list-container">
    <!-- 状态筛选选项卡 -->
    <view class="filter-section">
      <view class="tab-container">
        <view v-for="(tab, index) in tabItems" :key="index" class="tab-item" :class="{ active: currentTab === index }"
          @click="onTabClick(index)">
          <text>{{ tab }}</text>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-box" @click="showSearch = true">
        <text class="search-icon">🔍</text>
        <text class="search-text">{{ searchKeyword || '搜索工单...' }}</text>
      </view>
    </view>

    <!-- 工单列表 -->
    <scroll-view class="ticket-list" scroll-y @scrolltolower="onReachBottom" refresher-enabled
      :refresher-triggered="refreshing" @refresherrefresh="onPullDownRefresh">
      <!-- 空状态 -->
      <view v-if="ticketList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">{{ emptyText }}</text>
        <button v-if="userRole === 'student'" class="empty-btn" @click="navigateToCreate">创建工单</button>
      </view>

      <!-- 工单卡片列表 -->
      <view v-else class="ticket-cards">
        <view v-for="ticket in ticketList" :key="ticket.id" class="ticket-card" @click="navigateToDetail(ticket.id)">
          <view class="card-header">
            <text class="ticket-title">{{ ticket.title }}</text>
            <view class="status-tag" :class="getStatusClass(ticket.status)">
              <text>{{ getStatusText(ticket.status) }}</text>
            </view>
          </view>

          <view class="card-content">
            <view class="info-row">
              <text class="label">创建时间：</text>
              <text class="value">{{ formatTime(ticket.createTime) }}</text>
            </view>

            <view v-if="ticket.consultantName" class="info-row">
              <text class="label">咨询师：</text>
              <text class="value consultant-name">{{ ticket.consultantName }}</text>
            </view>

            <view class="info-row">
              <text class="label">工单编号：</text>
              <text class="value ticket-no">{{ ticket.ticketNo }}</text>
            </view>

            <view v-if="ticket.priority" class="info-row">
              <text class="label">优先级：</text>
              <text class="value priority-tag" :class="ticket.priority">
                {{ getPriorityText(ticket.priority) }}
              </text>
            </view>
          </view>

          <view class="card-footer">
            <view class="category-section">
              <text class="category-tag">{{ getCategoryText(ticket.category) }}</text>
              <text v-if="ticket.unreadCount > 0" class="unread-badge">{{ ticket.unreadCount }}</text>
            </view>
            <view class="actions" v-if="showActions(ticket)">
              <button v-if="canAccept(ticket)" class="action-btn accept" @click.stop="acceptTicket(ticket.id)">
                受理
              </button>
              <button v-if="canStart(ticket)" class="action-btn start" @click.stop="startConsultation(ticket.id)">
                开始咨询
              </button>
              <button v-if="canComplete(ticket)" class="action-btn complete" @click.stop="completeTicket(ticket.id)">
                完成
              </button>
              <button v-if="canClose(ticket)" class="action-btn close" @click.stop="closeTicket(ticket.id)">
                关闭
              </button>
              <!-- 删除按钮 - 硬删除版本 -->
              <button v-if="canDelete(ticket)" class="action-btn delete" @click.stop="handleDelete(ticket)"
                :loading="ticket.deleting" :disabled="ticket.deleting">
                {{ ticket.deleting ? '删除中...' : '删除' }}
              </button>
            </view>
            <text v-else class="update-time">更新于{{ formatRelativeTime(ticket.updateTime) }}</text>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="loading-more">
          <view class="loading-spinner"></view>
          <text>正在加载...</text>
        </view>

        <view v-if="noMore && ticketList.length > 0" class="no-more">
          <text>已经到底了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 新建工单浮动按钮（仅学生可见） -->
    <view v-if="userRole === 'student'" class="floating-action-btn" @click="navigateToCreate">
      <text class="fab-icon">+</text>
    </view>

    <!-- 搜索弹窗 -->
    <uni-popup ref="searchPopup" type="bottom">
      <view class="search-popup">
        <view class="popup-header">
          <text class="popup-title">搜索工单</text>
          <text class="popup-close" @click="showSearch = false">×</text>
        </view>
        <view class="search-input-container">
          <input class="search-input" v-model="searchKeyword" placeholder="请输入关键词搜索" @confirm="handleSearch" />
          <text class="clear-icon" v-if="searchKeyword" @click="clearSearch">×</text>
        </view>
        <view class="search-filters">
          <picker class="filter-picker" :range="categoryOptions" range-key="label" @change="onCategoryFilterChange">
            <view class="filter-item">
              <text class="filter-label">分类：</text>
              <text class="filter-value">{{ selectedCategoryFilter?.label || '全部' }}</text>
              <text class="filter-arrow">▼</text>
            </view>
          </picker>
          <picker class="filter-picker" :range="priorityOptions" range-key="label" @change="onPriorityFilterChange">
            <view class="filter-item">
              <text class="filter-label">优先级：</text>
              <text class="filter-value">{{ selectedPriorityFilter?.label || '全部' }}</text>
              <text class="filter-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="popup-buttons">
          <button class="popup-btn reset" @click="resetSearch">重置</button>
          <button class="popup-btn search" @click="handleSearch">搜索</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  // 根据 ticketApi.js 的导出方式，分别导入需要的函数
  import {
    getTicketList,
    updateTicketStatus,
    deleteTicket,
    getMyTicketStats,
    getStatusText,
    getPriorityText,
    getCategoryText,
    formatTime,
    formatRelativeTime
  } from '../../../api/ticketApi.js'

  export default {
    data() {
      return {
        currentTab: 0,
        ticketList: [],
        loading: false,
        refreshing: false,
        noMore: false,
        pageInfo: {
          page: 1,
          pageSize: 10,
          total: 0
        },
        tabItems: ['全部', '待受理', '咨询中', '已完成', '已关闭'],
        statusMap: {
          0: '', // 全部
          1: 'PENDING', // 待受理
          2: 'IN_PROGRESS', // 咨询中
          3: 'COMPLETED', // 已完成
          4: 'CLOSED' // 已关闭
        },
        userRole: 'student',
        userId: 1,

        // 搜索相关
        showSearch: false,
        searchKeyword: '',
        selectedCategoryFilter: null,
        selectedPriorityFilter: null,
        categoryOptions: [{
            value: '',
            label: '全部'
          },
          {
            value: 'STUDY',
            label: '学习压力'
          },
          {
            value: 'RELATIONSHIP',
            label: '人际关系'
          },
          {
            value: 'EMOTION',
            label: '情绪问题'
          },
          {
            value: 'CAREER',
            label: '职业规划'
          },
          {
            value: 'FAMILY',
            label: '家庭关系'
          },
          {
            value: 'LOVE',
            label: '恋爱问题'
          },
          {
            value: 'OTHER',
            label: '其他问题'
          }
        ],
        priorityOptions: [{
            value: '',
            label: '全部'
          },
          {
            value: 'LOW',
            label: '低'
          },
          {
            value: 'MEDIUM',
            label: '中'
          },
          {
            value: 'HIGH',
            label: '高'
          }
        ]
      }
    },

    computed: {
      // 根据当前标签获取状态筛选条件
      currentStatus() {
        return this.statusMap[this.currentTab] || ''
      },

      // 空状态文本
      emptyText() {
        if (this.searchKeyword || this.selectedCategoryFilter || this.selectedPriorityFilter) {
          return '没有找到符合条件的工单'
        }
        if (this.currentTab === 0) {
          return this.userRole === 'student' ? '您还没有创建工单' : '暂无工单'
        }
        return `暂无${this.tabItems[this.currentTab]}的工单`
      }
    },

    onLoad() {
      console.log('工单列表页面加载')
      console.log('当前用户信息:', uni.getStorageSync('userInfo'))
      console.log('当前token:', uni.getStorageSync('token') ? '存在' : '不存在')

      this.loadUserInfo()
      this.loadTicketList(true)

      // 监听工单更新事件（包括删除）
      uni.$on('ticket-deleted', (ticketId) => {
        console.log('接收到工单删除事件，刷新列表:', ticketId)
        // 从本地列表中移除对应的工单
        const index = this.ticketList.findIndex(t => t.id === ticketId)
        if (index !== -1) {
          this.ticketList.splice(index, 1)
        }
        // 重新加载数据
        this.refreshAfterDelete()
      })
    },

    onUnload() {
      uni.$off('ticket-updated')
      uni.$off('ticket-deleted') // 清理删除事件监听
    },

    onShow() {
      // 页面显示时刷新未读消息
      if (this.userRole === 'student' || this.userRole === 'counselor') {
        this.checkUnreadMessages()
      }
    },

    onPullDownRefresh() {
      this.onPullDownRefreshHandler().then(() => {
        uni.stopPullDownRefresh()
      })
    },

    onReachBottom() {
      if (!this.noMore && !this.loading) {
        this.loadTicketList(false)
      }
    },

    methods: {
      // 从本地存储加载用户信息
      loadUserInfo() {
        const userInfo = uni.getStorageSync('userInfo')
        console.log('从storage获取的用户信息:', userInfo)

        if (userInfo) {
          // 处理多种可能的用户信息格式
          this.userRole = userInfo.determinedRole ||
            userInfo.role ||
            userInfo.userType ||
            'student'

          // 确保用户ID是数字类型
          const userId = userInfo.id || userInfo.userId || userInfo.studentId
          this.userId = Number(userId) || 1

          console.log('解析后的用户信息:', {
            role: this.userRole,
            id: this.userId
          })
        } else {
          console.warn('没有找到用户信息，使用默认值')
          this.userRole = 'student'
          this.userId = 1
        }
      },

      onTabClick(index) {
        if (this.currentTab !== index) {
          this.currentTab = index
          this.resetList()
          this.loadTicketList(true)
        }
      },

      async onPullDownRefreshHandler() {
        this.refreshing = true
        try {
          await this.resetList()
          await this.loadTicketList(true)
        } finally {
          this.refreshing = false
        }
      },

      // 调用真实API加载工单列表
      async loadTicketList(isRefresh = false) {
        if (this.loading) return

        this.loading = true

        try {
          if (isRefresh) {
            this.pageInfo.page = 1
            this.noMore = false
          }

          // 构建请求参数
          const params = {
            page: this.pageInfo.page,
            pageSize: this.pageInfo.pageSize
          }

          // 添加状态筛选条件
          if (this.currentStatus) {
            params.status = this.currentStatus
          }

          // 根据用户角色添加不同筛选条件
          if (this.userRole === 'student') {
            params.studentId = this.userId
          } else if (this.userRole === 'counselor') {
            params.counselorId = this.userId
          }

          // 添加搜索条件
          if (this.searchKeyword) {
            params.keyword = this.searchKeyword
          }
          if (this.selectedCategoryFilter?.value) {
            params.category = this.selectedCategoryFilter.value
          }
          if (this.selectedPriorityFilter?.value) {
            params.priority = this.selectedPriorityFilter.value
          }

          console.log('请求参数:', params)

          // 调用真实API
          const response = await getTicketList(params)
          console.log('获取工单列表响应数据:', response)

          // 处理响应数据
          let tickets = []
          let total = 0

          if (response) {
            // 情况1：后端返回的是 { records: [], total: 10, ... } 格式
            if (response.records && Array.isArray(response.records)) {
              tickets = response.records
              total = response.total || 0

              // 更新分页信息
              this.pageInfo.total = total
              this.pageInfo.pageSize = response.size || this.pageInfo.pageSize
              this.pageInfo.page = response.current || this.pageInfo.page

              console.log('从records字段获取数据:', {
                数量: tickets.length,
                总数: total
              })
            }
            // 情况2：直接返回数组
            else if (Array.isArray(response)) {
              tickets = response
              total = tickets.length
              this.pageInfo.total = total
              console.log('直接返回数组数据:', {
                数量: response.length
              })
            }
            // 情况3：包含code和data字段的标准格式
            else if (response.code === 200 && response.data) {
              const data = response.data
              if (data.records && Array.isArray(data.records)) {
                tickets = data.records
                total = tickets.length
                this.pageInfo.total = total
                console.log('从标准格式获取数据:', {
                  数量: data.records.length
                })
              } else if (Array.isArray(data)) {
                tickets = data
                total = tickets.length
                this.pageInfo.total = total
                console.log('从data字段获取数组数据:', {
                  数量: data.length
                })
              }
            }
          }

          // 处理工单数据，确保字段正确
          const processedTickets = tickets.map(ticket => ({
            id: ticket.id,
            ticketNo: ticket.ticketNo,
            title: ticket.title,
            content: ticket.content,
            category: ticket.category,
            status: ticket.status,
            priority: ticket.priority,
            studentId: ticket.studentId,
            counselorId: ticket.counselorId,
            counselorName: ticket.counselorName,
            isAnonymous: ticket.isAnonymous,
            attachments: ticket.attachments,
            createTime: ticket.createTime,
            updateTime: ticket.updateTime,
            unreadCount: 0,
            selected: false,
            deleting: false
          }))

          console.log('处理后的工单数据:', processedTickets)

          if (isRefresh) {
            this.ticketList = processedTickets
          } else {
            this.ticketList = [...this.ticketList, ...processedTickets]
          }

          this.pageInfo.page++

          // 判断是否还有更多数据
          this.noMore = this.ticketList.length >= total ||
            processedTickets.length < this.pageInfo.pageSize ||
            !processedTickets.length

          console.log('分页状态:', {
            当前列表长度: this.ticketList.length,
            总数: total,
            是否没有更多: this.noMore,
            当前页: this.pageInfo.page
          })

        } catch (error) {
          console.error('加载工单列表失败:', error)
          uni.showToast({
            title: error.message || '网络错误，请重试',
            icon: 'none'
          })
        } finally {
          this.loading = false
          this.refreshing = false
        }
      },

      resetList() {
        return new Promise(resolve => {
          this.ticketList = []
          this.pageInfo.page = 1
          this.pageInfo.total = 0
          this.noMore = false
          resolve()
        })
      },

      refreshData() {
        this.resetList()
        this.loadTicketList(true)
      },

      // 状态相关方法
      getStatusClass(status) {
        // 将状态转换为小写，与CSS类名匹配
        const statusLower = status ? status.toLowerCase() : ''
        const statusClass = {
          'PENDING': 'pending',
          'IN_PROGRESS': 'in_progress',
          'COMPLETED': 'completed',
          'CLOSED': 'closed'
        }
        return statusClass[status] || ''
      },

      // 直接使用导入的函数
      getStatusText(status) {
        return getStatusText(status)
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

      // 权限判断方法
      showActions(ticket) {
        if (this.userRole === 'student') {
          return ticket.status === 'PENDING' && ticket.studentId === this.userId
        } else if (this.userRole === 'counselor') {
          return ['PENDING', 'IN_PROGRESS'].includes(ticket.status) &&
            (ticket.counselorId === this.userId || !ticket.counselorId)
        } else if (this.userRole === 'admin') {
          return true
        }
        return false
      },

      canAccept(ticket) {
        return this.userRole === 'counselor' &&
          ticket.status === 'PENDING' &&
          (!ticket.counselorId || ticket.counselorId === this.userId)
      },

      canStart(ticket) {
        return this.userRole === 'counselor' &&
          ticket.status === 'PENDING' &&
          ticket.counselorId === this.userId
      },

      canComplete(ticket) {
        return this.userRole === 'counselor' &&
          ticket.status === 'IN_PROGRESS' &&
          ticket.counselorId === this.userId
      },

      canClose(ticket) {
        if (this.userRole === 'student') {
          return ticket.status === 'PENDING' && ticket.studentId === this.userId
        } else if (this.userRole === 'counselor') {
          return ['PENDING', 'IN_PROGRESS'].includes(ticket.status) &&
            ticket.counselorId === this.userId
        }
        return false
      },

      // 增强的删除权限判断 - 硬删除版本
      canDelete(ticket) {
        console.log('[DEBUG] 检查删除权限:', {
          userRole: this.userRole,
          userId: this.userId,
          ticketStudentId: ticket.studentId,
          ticketCounselorId: ticket.counselorId,
          ticketStatus: ticket.status
        })

        let canDelete = false

        if (this.userRole === 'student') {
          // 学生只能删除自己的工单，且状态为 PENDING（硬删除权限更严格）
          canDelete = ticket.studentId === this.userId && ticket.status === 'PENDING'
        } else if (this.userRole === 'counselor') {
          // 咨询师只能删除自己负责的工单，且状态为 PENDING 或 CLOSED
          canDelete = ticket.counselorId === this.userId && ['PENDING', 'CLOSED'].includes(ticket.status)
        } else if (this.userRole === 'admin') {
          // 管理员可以删除任何工单
          canDelete = true
        }

        console.log('[DEBUG] 删除权限结果:', canDelete)
        return canDelete
      },

      // 专门用于删除后的刷新
      async refreshAfterDelete() {
        console.log('开始删除后刷新')

        // 方法1：重新加载当前页数据
        await this.loadTicketList(true)

        // 方法2：如果当前页没有数据，自动加载上一页
        if (this.ticketList.length === 0 && this.pageInfo.page > 1) {
          console.log('当前页无数据，尝试加载上一页')
          this.pageInfo.page = Math.max(1, this.pageInfo.page - 2)
          await this.loadTicketList(false)
        }

        console.log('删除后刷新完成')
      },

      async startConsultation(ticketId) {
        this.showConfirmDialog({
          title: '开始咨询',
          content: '确定要开始咨询吗？',
          type: 'info',
          onConfirm: async () => {
            await this.updateTicketStatus(ticketId, 'IN_PROGRESS', '开始咨询')
          }
        })
      },

      async completeTicket(ticketId) {
        this.showConfirmDialog({
          title: '完成咨询',
          content: '确定要标记为已完成吗？',
          type: 'warning',
          onConfirm: async () => {
            await this.updateTicketStatus(ticketId, 'COMPLETED', '咨询完成')
          }
        })
      },

      async closeTicket(ticketId) {
        this.showConfirmDialog({
          title: '关闭工单',
          content: '确定要关闭此工单吗？',
          type: 'warning',
          onConfirm: async () => {
            await this.updateTicketStatus(ticketId, 'CLOSED', '关闭工单')
          }
        })
      },

      // 硬删除工单方法
      async handleDelete(ticket) {
        // 设置删除中状态
        ticket.deleting = true

        // 根据用户角色显示不同的提示信息
        let deleteTitle = '确认删除'
        let deleteContent = '确定要永久删除此工单吗？删除后将无法恢复！'

        if (this.userRole === 'student') {
          deleteContent = '确定要永久删除您创建的工单吗？删除后将无法恢复！'
        } else if (this.userRole === 'counselor') {
          deleteContent = '确定要永久删除此咨询工单吗？删除后将无法恢复！'
        } else if (this.userRole === 'admin') {
          deleteTitle = '管理员删除确认'
          deleteContent = '您以管理员身份永久删除此工单。删除后将无法恢复！'
        }

        uni.showModal({
          title: deleteTitle,
          content: deleteContent,
          showCancel: true,
          confirmText: '确认删除',
          confirmColor: this.userRole === 'admin' ? '#DC3545' : '#FF3B30',
          cancelText: '取消',
          success: async (res) => {
            if (res.confirm) {
              try {
                // 显示删除进度
                uni.showLoading({
                  title: '正在删除...',
                  mask: true
                })

                // 调用硬删除API
                await deleteTicket(ticket.id)

                // 隐藏加载框
                uni.hideLoading()

                // 显示删除成功提示
                uni.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 2000
                })

                // 关键步骤1：立即从本地列表移除
                const index = this.ticketList.findIndex(t => t.id === ticket.id)
                if (index !== -1) {
                  this.ticketList.splice(index, 1)
                  // 更新分页总数
                  if (this.pageInfo.total > 0) {
                    this.pageInfo.total--
                  }
                }

                // 关键步骤2：触发全局更新事件，通知其他页面刷新
                uni.$emit('ticket-updated')
                uni.$emit('ticket-deleted', ticket.id)

                // 如果列表变为空，重新加载数据
                if (this.ticketList.length === 0) {
                  setTimeout(() => {
                    this.loadTicketList(true)
                  }, 800)
                }

              } catch (error) {
                uni.hideLoading()
                console.error('删除工单失败:', error)
                uni.showToast({
                  title: error.message || '删除失败，请稍后重试',
                  icon: 'none',
                  duration: 3000
                })
              } finally {
                ticket.deleting = false
              }
            } else {
              ticket.deleting = false
            }
          },
          fail: () => {
            ticket.deleting = false
          }
        })
      },

      // 使用真实API更新工单状态
      async updateTicketStatus(ticketId, status, remark) {
        try {
          const data = {
            status: status,
            remark: remark,
            operatorId: this.userId,
            operatorRole: this.userRole
          }

          await updateTicketStatus(ticketId, data)

          uni.showToast({
            title: '操作成功',
            icon: 'success'
          })

          // 刷新数据
          this.refreshData()

          // 触发全局更新事件
          uni.$emit('ticket-updated')

        } catch (error) {
          console.error('更新工单状态失败:', error)
          uni.showToast({
            title: error.message || '操作失败，请重试',
            icon: 'none'
          })
        }
      },

      // 搜索相关方法
      onCategoryFilterChange(e) {
        const index = e.detail.value
        this.selectedCategoryFilter = this.categoryOptions[index]
      },

      onPriorityFilterChange(e) {
        const index = e.detail.value
        this.selectedPriorityFilter = this.priorityOptions[index]
      },

      handleSearch() {
        this.showSearch = false
        this.resetList()
        this.loadTicketList(true)
      },

      resetSearch() {
        this.searchKeyword = ''
        this.selectedCategoryFilter = null
        this.selectedPriorityFilter = null
      },

      clearSearch() {
        this.searchKeyword = ''
      },

      // 显示确认弹窗（修复uni-popup调用问题）
      showConfirmDialog(config) {
        // 使用uni.showModal替代uni-popup
        uni.showModal({
          title: config.title || '提示',
          content: config.content,
          confirmText: '确认',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              if (config.onConfirm) {
                config.onConfirm()
              }
            } else if (res.cancel) {
              if (config.onCancel) {
                config.onCancel()
              }
            }
          }
        })
      },

      // 检查未读消息
      async checkUnreadMessages() {
        try {
          // 获取未读消息统计
          const stats = await getMyTicketStats()
          console.log('工单统计结果:', stats)

          if (stats && stats.unreadCount > 0) {
            // 更新列表中的未读状态
            this.ticketList.forEach(ticket => {
              if (stats.ticketUnread && stats.ticketUnread[ticket.id]) {
                ticket.unreadCount = stats.ticketUnread[ticket.id]
              }
            })
          }
        } catch (error) {
          console.warn('检查未读消息失败，但不影响主要功能:', error.message)
          // 不显示错误提示，避免影响用户体验
        }
      },

      // 工单点击事件
      navigateToDetail(ticketId) {
        uni.navigateTo({
          url: `/pages/ticket/detail/detail?id=${ticketId}`
        })
      },

      navigateToCreate() {
        uni.navigateTo({
          url: '/pages/ticket/create/create'
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .ticket-list-container {
    height: 100vh;
    background-color: #F5F7FA;
    display: flex;
    flex-direction: column;
  }

  .filter-section {
    background: #FFFFFF;
    padding: 20rpx 30rpx 30rpx;
    border-bottom: 1rpx solid #EEEEEE;
  }

  .tab-container {
    display: flex;
    background: #F8F9FA;
    border-radius: 50rpx;
    padding: 8rpx;
    margin-bottom: 20rpx;
  }

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    border-radius: 40rpx;
    color: #666666;
    font-size: 28rpx;
    transition: all 0.3s ease;
  }

  .tab-item.active {
    background: #4A90E2;
    color: #FFFFFF;
    font-weight: bold;
  }

  .search-box {
    display: flex;
    align-items: center;
    background: #F8F9FA;
    border-radius: 40rpx;
    padding: 20rpx 24rpx;
    color: #999999;
    font-size: 26rpx;
  }

  .search-icon {
    margin-right: 12rpx;
    font-size: 28rpx;
  }

  .ticket-list {
    flex: 1;
    height: 100%;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
  }

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 40rpx;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999999;
    margin-bottom: 40rpx;
    text-align: center;
  }

  .empty-btn {
    background: #4A90E2;
    color: #FFFFFF;
    border: none;
    border-radius: 44rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
  }

  .ticket-cards {
    padding: 30rpx;
  }

  .ticket-card {
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    position: relative;
    border: 2rpx solid transparent;
    transition: border-color 0.3s ease;
  }

  .ticket-card.deleting {
    opacity: 0.7;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
  }

  .ticket-title {
    flex: 1;
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    line-height: 1.4;
    margin-right: 20rpx;
  }

  .status-tag {
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
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

  .card-content .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .card-content .info-row:last-child {
    margin-bottom: 0;
  }

  .card-content .label {
    font-size: 26rpx;
    color: #666666;
    min-width: 140rpx;
  }

  .card-content .value {
    font-size: 26rpx;
    color: #333333;
    flex: 1;
  }

  .card-content .consultant-name {
    color: #4A90E2;
    font-weight: 500;
  }

  .card-content .ticket-no {
    font-family: 'Courier New', monospace;
    color: #999999;
  }

  .priority-tag {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    font-weight: 500;
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

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #F0F0F0;
  }

  .category-section {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  .category-tag {
    background: #E8F4FF;
    color: #4A90E2;
    font-size: 22rpx;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
  }

  .unread-badge {
    background: #FF3B30;
    color: #FFFFFF;
    font-size: 20rpx;
    min-width: 32rpx;
    height: 32rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8rpx;
  }

  .update-time {
    font-size: 22rpx;
    color: #999999;
  }

  .actions {
    display: flex;
    gap: 10rpx;
  }

  .action-btn {
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    border: none;
    color: #FFFFFF;
    white-space: nowrap;
    transition: all 0.3s ease;
  }

  .action-btn.accept {
    background: #4A90E2;
  }

  .action-btn.start {
    background: #28A745;
  }

  .action-btn.complete {
    background: #17A2B8;
  }

  .action-btn.close {
    background: #6C757D;
  }

  .action-btn.delete {
    background: #FF3B30;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40rpx 0;
    color: #999999;
    font-size: 26rpx;
  }

  .loading-spinner {
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid #F3F3F3;
    border-top: 4rpx solid #4A90E2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .no-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40rpx 0;
    color: #999999;
    font-size: 26rpx;
  }

  .floating-action-btn {
    position: fixed;
    right: 40rpx;
    bottom: 120rpx;
    width: 100rpx;
    height: 100rpx;
    background: #4A90E2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(74, 144, 226, 0.4);
    z-index: 999;
  }

  .fab-icon {
    color: #FFFFFF;
    font-size: 36rpx;
    font-weight: bold;
  }

  // 搜索弹窗样式
  .search-popup {
    background: #FFFFFF;
    border-radius: 20rpx 20rpx 0 0;
    padding: 40rpx;
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

  .search-input-container {
    position: relative;
    margin-bottom: 30rpx;
  }

  .search-input {
    width: 100%;
    height: 88rpx;
    background: #F8F9FA;
    border: 2rpx solid #E0E0E0;
    border-radius: 12rpx;
    padding: 0 80rpx 0 30rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }

  .clear-icon {
    position: absolute;
    right: 30rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #CCCCCC;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: bold;
  }

  .search-filters {
    display: flex;
    gap: 20rpx;
    margin-bottom: 40rpx;
  }

  .filter-picker {
    flex: 1;
  }

  .filter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F8F9FA;
    border: 2rpx solid #E0E0E0;
    border-radius: 12rpx;
    padding: 20rpx 24rpx;
    font-size: 26rpx;
  }

  .filter-label {
    color: #666666;
  }

  .filter-value {
    color: #333333;
    flex: 1;
    text-align: right;
    margin: 0 10rpx;
  }

  .filter-arrow {
    color: #999999;
    font-size: 20rpx;
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

    &.reset {
      background: #F8F9FA;
      color: #666666;
    }

    &.search {
      background: #4A90E2;
      color: #FFFFFF;
    }
  }
</style>