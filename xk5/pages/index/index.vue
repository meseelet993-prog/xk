<template>
  <view class="index-container">
    <!-- 顶部轮播图 -->
    <view class="banner-section">
      <swiper class="banner-swiper" :autoplay="true" :interval="3000" :duration="500" circular indicator-dots
        indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#FFFFFF">
        <swiper-item v-for="(banner, index) in bannerList" :key="index" class="banner-item">
          <image :src="banner.image" mode="aspectFill" class="banner-image" @click="handleBannerClick(banner)" />
          <view class="banner-title">{{ banner.title }}</view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷功能入口 - 使用 view 代替 uni-grid -->
    <view class="quick-actions-section">
      <view class="quick-grid">
        <view v-for="action in quickActions" :key="action.id" class="quick-item" @click="handleQuickAction(action)">
          <view class="quick-icon">
            <text class="icon-text">{{ action.icon }}</text>
          </view>
          <text class="quick-text">{{ action.text }}</text>
        </view>
      </view>
    </view>

    <!-- 通知公告 -->
    <view class="notice-section">
      <view class="section-header">
        <text class="section-title">通知公告</text>
        <text class="section-more" @click="navigateToNoticeList">更多 ></text>
      </view>
      <view class="notice-list">
        <view v-for="notice in noticeList" :key="notice.id" class="notice-item" @click="handleNoticeClick(notice)">
          <text class="notice-title">{{ notice.title }}</text>
          <text class="notice-time">{{ notice.time }}</text>
        </view>
      </view>
    </view>

    <!-- 咨询师推荐 -->
    <view class="consultant-section">
      <view class="section-header">
        <text class="section-title">推荐咨询师</text>
        <text class="section-more" @click="navigateToConsultantList">更多 ></text>
      </view>
      <scroll-view class="consultant-scroll" scroll-x :scroll-left="scrollLeft" scroll-with-animation>
        <view class="consultant-list">
          <!-- 正常显示的咨询师卡片 -->
          <view v-for="consultant in displayedConsultants" :key="consultant.id" class="consultant-card"
            @click="handleConsultantClick(consultant)">
            <image :src="consultant.avatar" class="avatar" mode="aspectFill" />
            <view class="info">
              <text class="name">{{ consultant.name }}</text>
              <text class="title">{{ consultant.title }}</text>
              <view class="specialty">
                <text v-for="(item, index) in consultant.specialty" :key="index" class="specialty-tag">
                  {{ item }}
                </text>
              </view>
              <view class="meta">
                <text class="rating">⭐ {{ consultant.rating }}</text>
                <text class="experience">{{ consultant.experience }}年经验</text>
              </view>
            </view>
          </view>

          <!-- 查看更多卡片（在小屏时显示） -->
          <view v-if="!showAllConsultants && consultantList.length > visibleCount" class="consultant-card more-card"
            @click="showMoreConsultants">
            <view class="more-content">
              <text class="more-text">查看更多</text>
              <text class="more-icon">→</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 调试信息 -->
    <view class="debug-info" v-if="isDevelopment">
      <text>当前角色: {{ userRole }}</text>
      <button @click="switchRole('student')">学生</button>
      <button @click="switchRole('consultant')">咨询师</button>
      <button @click="switchRole('admin')">管理员</button>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        bannerList: [],
        quickActions: [],
        noticeList: [],
        consultantList: [],
        loading: false,
        userRole: 'student',
        isDevelopment: true,

        // 新增：咨询师显示控制
        showAllConsultants: false,
        visibleCount: 2, // 默认显示2个咨询师
        scrollLeft: 0,
        systemInfo: null,
        screenWidth: 375 // 默认值，会在onLoad中更新
      }
    },

    computed: {
      // 计算要显示的咨询师列表
      displayedConsultants() {
        if (this.showAllConsultants) {
          return this.consultantList;
        }
        return this.consultantList.slice(0, this.visibleCount);
      }
    },

    onLoad(options) {
      console.log('首页加载，参数:', options)

      // 获取系统信息，判断屏幕宽度
      this.getSystemInfo();

      // 如果有传递角色参数，优先使用URL参数
      if (options.role) {
        this.userRole = this.normalizeRole(options.role)
        console.log('从URL参数获取角色:', this.userRole)
      }

      // 加载首页数据
      this.loadHomeData()
    },

    onShow() {
      console.log('首页显示')
      this.loadUserInfo()
    },

    onPullDownRefresh() {
      this.refreshData().then(() => {
        uni.stopPullDownRefresh()
      })
    },

    onReachBottom() {
      this.loadMoreData()
    },

    methods: {
      // 获取系统信息
      getSystemInfo() {
        try {
          const systemInfo = uni.getSystemInfoSync();
          this.systemInfo = systemInfo;
          this.screenWidth = systemInfo.screenWidth || 375;
          console.log('屏幕宽度:', this.screenWidth);

          // 根据屏幕宽度设置可见咨询师数量
          if (this.screenWidth >= 768) {
            // 大屏幕显示3个
            this.visibleCount = 3;
            this.showAllConsultants = true; // 大屏默认显示全部
          } else {
            // 小屏幕显示2个
            this.visibleCount = 2;
            this.showAllConsultants = false;
          }
        } catch (e) {
          console.error('获取系统信息失败:', e);
        }
      },

      // 显示更多咨询师
      showMoreConsultants() {
        this.showAllConsultants = true;

        // 滚动到第三个咨询师
        setTimeout(() => {
          const cardWidth = 280 + 20; // 卡片宽度 + 右边距
          this.scrollLeft = cardWidth * 2; // 滚动到第三个卡片的位置
        }, 50);
      },

      // 加载首页数据 - 新增的方法
      loadHomeData() {
        console.log('加载首页数据')

        try {
          const userInfo = uni.getStorageSync('userInfo')
          console.log('首页获取的用户信息:', JSON.stringify(userInfo, null, 2))

          if (userInfo) {
            // 【关键修改】按优先级获取角色
            let role = this.getUserRole(userInfo)
            this.userRole = this.normalizeRole(role)
            console.log('用户角色:', this.userRole)

            // 根据角色显示不同的首页内容
            this.showHomeByRole()
          }

          // 初始化页面数据
          this.initData()
        } catch (error) {
          console.error('加载首页数据失败:', error)
        }
      },

      // 获取用户角色（优先级顺序）
      getUserRole(userInfo) {
        if (!userInfo) return 'student'

        // 优先级 1: 如果已经设置了userRole（如从URL参数获取）
        if (this.userRole && this.userRole !== 'student') {
          return this.userRole
        }

        // 优先级 2: 后端返回的loginRole（最重要）
        if (userInfo.loginRole) {
          console.log('使用loginRole:', userInfo.loginRole)
          return userInfo.loginRole
        }

        // 优先级 3: 前端确定的determinedRole
        if (userInfo.determinedRole) {
          console.log('使用determinedRole:', userInfo.determinedRole)
          return userInfo.determinedRole
        }

        // 优先级 4: 用户对象中的role（数据库角色）
        if (userInfo.user && userInfo.user.role) {
          console.log('使用user.role:', userInfo.user.role)
          return userInfo.user.role
        }

        // 默认值
        console.log('使用默认角色: student')
        return 'student'
      },

      // 加载用户信息
      loadUserInfo() {
        try {
          const storedUserInfo = uni.getStorageSync('userInfo')
          if (storedUserInfo) {
            const role = this.getUserRole(storedUserInfo)
            this.userRole = this.normalizeRole(role)
          }
        } catch (e) {
          console.error('获取用户信息失败:', e)
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

      // 根据角色显示不同的首页内容
      showHomeByRole() {
        console.log('首页显示，角色为:', this.userRole)

        // 根据不同的角色显示不同的首页内容
        switch (this.userRole) {
          case 'consultant':
            // 显示咨询师首页
            console.log('显示咨询师首页')
            this.updatePageTitle()
            // 这里可以设置咨询师专属的数据或UI状态
            break

          case 'admin':
            // 显示管理员首页
            console.log('显示管理员首页')
            this.updatePageTitle()
            break

          case 'student':
          default:
            // 显示学生首页
            console.log('显示学生首页')
            this.updatePageTitle()
            break
        }
      },

      // 更新页面标题
      updatePageTitle() {
        const titleMap = {
          'student': '心理健康咨询平台',
          'consultant': '咨询师工作台',
          'admin': '管理员面板'
        }

        uni.setNavigationBarTitle({
          title: titleMap[this.userRole] || '心理健康咨询平台'
        })
      },

      initData() {
        // 轮播图数据
        this.bannerList = [{
            id: 1,
            image: '/static/images/banners/banner1.png',
            title: '关注心理健康，从了解开始',
            link: '/pages/article/detail?id=1'
          },
          {
            id: 2,
            image: '/static/images/banners/banner2.png',
            title: '专业心理咨询服务',
            link: '/pages/consultant/list'
          },
          {
            id: 3,
            image: '/static/images/banners/banner3.png',
            title: '心理健康知识普及',
            link: '/pages/knowledge/list'
          }
        ]

        // 快捷功能 - 修正跳转配置
        this.quickActions = [{
            id: 1,
            text: '创建工单',
            icon: '+',
            type: 'navigate',
            url: '/pages/ticket/create/create'
          },
          {
            id: 2,
            text: '我的工单',
            icon: '📋',
            type: 'switchTab',
            url: '/pages/ticket/list/list'
          },
          {
            id: 3,
            text: '在线咨询',
            icon: '💬',
            type: 'navigate',
            url: '/pages/consultant/list'
          },
          {
            id: 4,
            text: '心理测试',
            icon: '📊',
            type: 'navigate',
            url: '/pages/test/list'
          }
        ]

        // 通知公告
        this.noticeList = [{
            id: 1,
            title: '平台系统维护通知',
            content: '将于本周六凌晨进行系统维护',
            time: '2024-01-15',
            type: 'system'
          },
          {
            id: 2,
            title: '新增心理咨询师入驻',
            content: '欢迎10位专业心理咨询师加入',
            time: '2024-01-14',
            type: 'news'
          },
          {
            id: 3,
            title: '心理健康讲座预告',
            content: '本周五晚上8点线上讲座',
            time: '2024-01-13',
            type: 'activity'
          }
        ]

        // 咨询师推荐
        this.consultantList = [{
            id: 1,
            name: '张心理咨询师',
            avatar: '/static/images/avatars/consultant1.jpg',
            title: '国家二级心理咨询师',
            specialty: ['情绪管理', '人际关系'],
            rating: 4.8,
            experience: 5,
          },
          {
            id: 2,
            name: '李心理专家',
            avatar: '/static/images/avatars/consultant2.jpg',
            title: '心理学博士',
            specialty: ['焦虑症', '抑郁症'],
            rating: 4.9,
            experience: 8,
          },
          {
            id: 3,
            name: '王心理咨询师',
            avatar: '/static/images/avatars/consultant3.jpg',
            title: '资深心理咨询师',
            specialty: ['婚姻家庭', '亲子关系'],
            rating: 4.7,
            experience: 6,

          }
        ]
      },

      handleBannerClick(banner) {
        if (banner.link) {
          uni.navigateTo({
            url: banner.link
          })
        }
      },

      handleQuickAction(action) {
        if (action.url) {
          if (action.type === 'switchTab') {
            uni.switchTab({
              url: action.url
            })
          } else {
            uni.navigateTo({
              url: action.url
            })
          }
        }
      },

      handleNoticeClick(notice) {
        uni.navigateTo({
          url: `/pages/notice/detail?id=${notice.id}`
        })
      },

      handleConsultantClick(consultant) {
        uni.navigateTo({
          url: `/pages/consultant/detail?id=${consultant.id}`
        })
      },

      navigateToNoticeList() {
        uni.navigateTo({
          url: '/pages/notice/list'
        })
      },

      navigateToConsultantList() {
        uni.navigateTo({
          url: '/pages/consultant/list/list'
        })
      },

      async refreshData() {
        this.loading = true
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000))
          this.initData()
        } catch (error) {
          console.error('刷新数据失败:', error)
        } finally {
          this.loading = false
        }
      },

      loadMoreData() {
        // 这里可以加载更多咨询师数据
        console.log('加载更多数据...')
      },

      // 调试用角色切换
      switchRole(role) {
        this.userRole = role
        console.log('手动切换到角色:', role)

        // 更新存储以便测试
        const userInfo = uni.getStorageSync('userInfo') || {}
        userInfo.loginRole = role.toUpperCase()
        uni.setStorageSync('userInfo', userInfo)

        // 根据新角色更新页面
        this.showHomeByRole()
      }
    }
  }
</script>

<style scoped>
  .index-container {
    background-color: #F5F7FA;
    min-height: 100vh;
    padding-bottom: 120rpx;
  }

  .banner-section {
    padding: 30rpx;
  }

  .banner-swiper {
    height: 300rpx;
    border-radius: 20rpx;
    overflow: hidden;
  }

  .banner-item {
    position: relative;
    height: 100%;
  }

  .banner-image {
    width: 100%;
    height: 100%;
  }

  .banner-title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    color: #FFFFFF;
    padding: 20rpx;
    font-size: 28rpx;
  }

  .quick-actions-section {
    background: #FFFFFF;
    margin: 20rpx 30rpx;
    border-radius: 20rpx;
    padding: 30rpx 0;
  }

  .quick-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .quick-item {
    flex: 0 0 25%;
    padding: 20rpx 0;
    text-align: center;
  }

  .quick-icon {
    width: 80rpx;
    height: 80rpx;
    background: #4A90E2;
    border-radius: 50%;
    margin: 0 auto 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
  }

  .quick-text {
    font-size: 24rpx;
    color: #333333;
    text-align: center;
  }

  .notice-section,
  .consultant-section {
    background: #FFFFFF;
    margin: 20rpx 30rpx;
    border-radius: 20rpx;
    padding: 30rpx;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
  }

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .section-more {
    font-size: 26rpx;
    color: #4A90E2;
  }

  .notice-list .notice-item {
    padding: 20rpx 0;
    border-bottom: 1rpx solid #F0F0F0;
  }

  .notice-list .notice-item:last-child {
    border-bottom: none;
  }

  .notice-title {
    display: block;
    font-size: 28rpx;
    color: #333333;
    margin-bottom: 8rpx;
  }

  .notice-time {
    font-size: 24rpx;
    color: #999999;
  }

  .consultant-scroll {
    white-space: nowrap;
  }

  .consultant-list {
    display: flex;
    gap: 20rpx;
  }

  .consultant-card {
    display: inline-block;
    width: 280rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  /* 查看更多卡片样式 */
  .more-card {
    background: #F5F7FA;
    border: 2rpx dashed #E0E0E0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .more-content {
    text-align: center;
  }

  .more-text {
    display: block;
    font-size: 28rpx;
    color: #666666;
    margin-bottom: 10rpx;
  }

  .more-icon {
    font-size: 32rpx;
    color: #999999;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-bottom: 20rpx;
  }

  .name {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 8rpx;
  }

  .title {
    display: block;
    font-size: 24rpx;
    color: #666666;
    margin-bottom: 16rpx;
  }

  .specialty {
    margin-bottom: 16rpx;
  }

  .specialty-tag {
    display: inline-block;
    background: #E8F4FF;
    color: #4A90E2;
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    margin-right: 8rpx;
    margin-bottom: 8rpx;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .rating,
  .experience {
    font-size: 22rpx;
    color: #999999;
  }

  /*  .price {
    font-size: 28rpx;
    color: #FF6B35;
    font-weight: bold;
  } */

  /* 调试信息样式 */
  .debug-info {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20rpx;
    font-size: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .debug-info button {
    background: #4A90E2;
    color: white;
    border: none;
    border-radius: 10rpx;
    padding: 10rpx 20rpx;
    font-size: 20rpx;
    margin: 0 5rpx;
  }
</style>