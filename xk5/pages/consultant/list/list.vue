<template>
  <view class="consultant-list-container">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <uni-icons type="search" size="20" color="#999"></uni-icons>
        <input class="search-input" v-model="searchKeyword" placeholder="搜索咨询师、擅长领域..." @confirm="handleSearch"
          @input="handleSearchInput" />
        <button class="filter-btn" @click="showFilter = true">
          <uni-icons type="filter" size="20" color="#666"></uni-icons>
          筛选
        </button>
      </view>
    </view>

    <!-- 筛选条件显示 -->
    <view class="filter-tags" v-if="activeFilters.length > 0">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-tag-list">
          <view class="filter-tag" v-for="filter in activeFilters" :key="filter.key">
            {{ filter.label }}: {{ filter.value }}
            <text class="filter-remove" @click="removeFilter(filter.key)">×</text>
          </view>
          <text class="filter-clear" @click="clearFilters">清除全部</text>
        </view>
      </scroll-view>
    </view>

    <!-- 排序选项 -->
    <view class="sort-section">
      <view class="sort-options">
        <text class="sort-option" :class="{ active: sortType === 'default' }" @click="changeSort('default')">
          默认
        </text>
        <text class="sort-option" :class="{ active: sortType === 'rating' }" @click="changeSort('rating')">
          评分最高
        </text>
        <text class="sort-option" :class="{ active: sortType === 'experience' }" @click="changeSort('experience')">
          经验最丰富
        </text>
        <text class="sort-option" :class="{ active: sortType === 'consultation' }" @click="changeSort('consultation')">
          咨询最多
        </text>
      </view>
    </view>

    <!-- 免费咨询提示 -->
    <view class="free-consultant-tip">
      <uni-icons type="info-filled" size="16" color="#4A90E2"></uni-icons>
      <text class="tip-text">平台所有咨询服务均为免费，请放心咨询</text>
    </view>

    <!-- 咨询师列表 -->
    <view class="consultant-list" v-if="filteredConsultants.length > 0">
      <view v-for="consultant in filteredConsultants" :key="consultant.id" class="consultant-item"
        @click="navigateToDetail(consultant.id)">
        <view class="item-left">
          <image :src="consultant.avatar" class="avatar" mode="aspectFill" />
          <view class="consultant-status" :class="getStatusClass(consultant.status)">
            {{ getStatusText(consultant.status) }}
          </view>
        </view>

        <view class="item-center">
          <view class="consultant-info">
            <text class="name">{{ consultant.name }}</text>
            <text class="title">{{ consultant.title }}</text>
            <view class="tags">
              <text class="tag rating-tag">⭐ {{ consultant.rating }}</text>
              <text class="tag experience-tag">{{ consultant.experience }}年经验</text>
              <text class="tag consultation-tag">已咨询{{ consultant.consultationCount || 0 }}次</text>
            </view>
          </view>

          <view class="specialty-section">
            <text class="specialty-label">擅长：</text>
            <view class="specialty-tags">
              <text v-for="(item, index) in consultant.specialty" :key="index" class="specialty-tag"
                @click.stop="filterBySpecialty(item)">
                {{ item }}
              </text>
            </view>
          </view>

          <view class="description">
            {{ consultant.description || '资深心理咨询师，专注心理健康领域...' }}
          </view>
        </view>

        <view class="item-right">
          <button class="consult-btn" @click.stop="handleConsult(consultant)">
            免费咨询
          </button>
          <button class="detail-btn" @click.stop="navigateToDetail(consultant.id)">
            详情
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image src="/static/images/empty-state.png" class="empty-image" mode="aspectFit" />
      <text class="empty-text">暂无符合条件的咨询师</text>
      <button class="empty-btn" @click="clearFilters">重新筛选</button>
    </view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="filterPopup" type="bottom" background-color="#fff">
      <view class="filter-popup">
        <view class="popup-header">
          <text class="popup-title">筛选</text>
          <text class="popup-close" @click="closeFilter">×</text>
        </view>

        <scroll-view scroll-y class="popup-content">
          <!-- 评分筛选 -->
          <view class="filter-group">
            <text class="filter-group-title">最低评分</text>
            <view class="rating-options">
              <text v-for="rating in ratingOptions" :key="rating.value" class="rating-option"
                :class="{ active: selectedRating === rating.value }" @click="selectRating(rating.value)">
                {{ rating.label }}
              </text>
            </view>
          </view>

          <!-- 经验筛选 -->
          <view class="filter-group">
            <text class="filter-group-title">经验要求</text>
            <view class="experience-options">
              <text v-for="exp in experienceOptions" :key="exp.value" class="experience-option"
                :class="{ active: selectedExperience === exp.value }" @click="selectExperience(exp.value)">
                {{ exp.label }}
              </text>
            </view>
          </view>

          <!-- 擅长领域筛选 -->
          <view class="filter-group">
            <text class="filter-group-title">擅长领域</text>
            <view class="specialty-options">
              <text v-for="spec in specialtyOptions" :key="spec.value" class="specialty-option"
                :class="{ active: selectedSpecialties.includes(spec.value) }" @click="toggleSpecialty(spec.value)">
                {{ spec.label }}
              </text>
            </view>
          </view>

          <!-- 状态筛选 -->
          <view class="filter-group">
            <text class="filter-group-title">咨询师状态</text>
            <view class="status-options">
              <text class="status-option" :class="{ active: selectedStatus === 'online' }"
                @click="selectStatus('online')">
                在线
              </text>
              <text class="status-option" :class="{ active: selectedStatus === 'busy' }" @click="selectStatus('busy')">
                忙碌
              </text>
              <text class="status-option" :class="{ active: selectedStatus === 'all' }" @click="selectStatus('all')">
                全部
              </text>
            </view>
          </view>
        </scroll-view>

        <view class="popup-footer">
          <button class="reset-btn" @click="resetFilters">重置</button>
          <button class="confirm-btn" @click="applyFilters">确定</button>
        </view>
      </view>
    </uni-popup>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <button class="back-btn" @click="navigateBack">返回首页</button>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        // 搜索相关
        searchKeyword: '',

        // 排序相关
        sortType: 'default',

        // 筛选相关
        showFilter: false,
        selectedRating: null,
        selectedExperience: null,
        selectedSpecialties: [],
        selectedStatus: 'all', // 新增：状态筛选

        // 筛选选项
        ratingOptions: [{
            value: 4.5,
            label: '4.5分以上'
          },
          {
            value: 4.0,
            label: '4.0分以上'
          },
          {
            value: 3.5,
            label: '3.5分以上'
          }
        ],

        experienceOptions: [{
            value: 5,
            label: '5年以上'
          },
          {
            value: 3,
            label: '3年以上'
          },
          {
            value: 1,
            label: '1年以上'
          }
        ],

        specialtyOptions: [{
            value: '情绪管理',
            label: '情绪管理'
          },
          {
            value: '人际关系',
            label: '人际关系'
          },
          {
            value: '焦虑症',
            label: '焦虑症'
          },
          {
            value: '抑郁症',
            label: '抑郁症'
          },
          {
            value: '恋爱关系',
            label: '恋爱关系'
          },
          {
            value: '家庭关系',
            label: '家庭关系'
          },
          {
            value: '压力管理',
            label: '压力管理'
          },
          {
            value: '职业发展',
            label: '职业发展'
          }
        ],

        // 咨询师数据
        allConsultants: [],
        filteredConsultants: [],

        // 活动筛选标签
        activeFilters: []
      }
    },

    onLoad(options) {
      console.log('咨询师列表页面加载', options)
      this.initData()
    },

    methods: {
      // 初始化数据
      initData() {
        // 咨询师数据 - 只有5个咨询师
        this.allConsultants = [{
            id: 1,
            name: '张心理咨询师',
            avatar: '/static/images/avatars/consultant1.jpg',
            title: '国家二级心理咨询师',
            specialty: ['情绪管理', '人际关系', '压力管理'],
            rating: 4.8,
            experience: 5,
            status: 'online',
            description: '擅长情绪管理和人际关系咨询，帮助数百人走出心理困境。',
            consultationCount: 1245
          },
          {
            id: 2,
            name: '李心理专家',
            avatar: '/static/images/avatars/consultant2.jpg',
            title: '心理学博士',
            specialty: ['焦虑症', '抑郁症', '情绪管理'],
            rating: 4.9,
            experience: 8,
            status: 'busy',
            description: '心理学博士，专注焦虑症和抑郁症治疗，发表多篇学术论文。',
            consultationCount: 1892
          },
          {
            id: 3,
            name: '王心理咨询师',
            avatar: '/static/images/avatars/consultant3.jpg',
            title: '资深心理咨询师',
            specialty: ['恋爱关系', '家庭关系', '职业发展'],
            rating: 4.7,
            experience: 6,
            status: 'online',
            description: '专注于恋爱关系和家庭关系咨询，拥有丰富的家庭治疗经验。',
            consultationCount: 956
          },
          {
            id: 4,
            name: '赵心理咨询师',
            avatar: '/static/images/avatars/consultant4.jpg',
            title: '临床心理治疗师',
            specialty: ['抑郁症', '压力管理', '人际关系'],
            rating: 4.6,
            experience: 4,
            status: 'offline',
            description: '临床心理治疗师，擅长抑郁症治疗和压力管理。',
            consultationCount: 672
          },
          {
            id: 5,
            name: '刘心理咨询师',
            avatar: '/static/images/avatars/consultant5.jpg',
            title: '青少年心理咨询师',
            specialty: ['家庭关系', '情绪管理', '职业发展'],
            rating: 4.8,
            experience: 7,
            status: 'online',
            description: '专注青少年心理问题，帮助青少年解决成长中的困惑。',
            consultationCount: 1103
          }
        ]

        // 初始化显示数据
        this.filteredConsultants = [...this.allConsultants]
      },

      // 搜索处理
      handleSearch() {
        this.filterConsultants()
      },

      handleSearchInput() {
        // 添加防抖处理
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => {
          this.filterConsultants()
        }, 500)
      },

      // 筛选咨询师
      filterConsultants() {
        let result = [...this.allConsultants]

        // 关键词搜索
        if (this.searchKeyword.trim()) {
          const keyword = this.searchKeyword.toLowerCase()
          result = result.filter(consultant =>
            consultant.name.toLowerCase().includes(keyword) ||
            consultant.title.toLowerCase().includes(keyword) ||
            consultant.specialty.some(s => s.toLowerCase().includes(keyword)) ||
            consultant.description.toLowerCase().includes(keyword)
          )
        }

        // 评分筛选
        if (this.selectedRating !== null) {
          result = result.filter(consultant => consultant.rating >= this.selectedRating)
        }

        // 经验筛选
        if (this.selectedExperience !== null) {
          result = result.filter(consultant => consultant.experience >= this.selectedExperience)
        }

        // 擅长领域筛选
        if (this.selectedSpecialties.length > 0) {
          result = result.filter(consultant =>
            this.selectedSpecialties.some(specialty =>
              consultant.specialty.includes(specialty)
            )
          )
        }

        // 状态筛选
        if (this.selectedStatus !== 'all') {
          result = result.filter(consultant => consultant.status === this.selectedStatus)
        }

        // 排序
        this.sortConsultants(result)

        this.filteredConsultants = result
        this.updateActiveFilters()
      },

      // 排序
      sortConsultants(list) {
        switch (this.sortType) {
          case 'rating':
            list.sort((a, b) => b.rating - a.rating)
            break
          case 'experience':
            list.sort((a, b) => b.experience - a.experience)
            break
          case 'consultation':
            list.sort((a, b) => (b.consultationCount || 0) - (a.consultationCount || 0))
            break
          default:
            // 默认排序（综合排序）
            list.sort((a, b) => {
              // 可以根据咨询次数、评分等因素综合排序
              const scoreA = a.rating * 100 + a.experience * 10 + (a.consultationCount || 0) / 100
              const scoreB = b.rating * 100 + b.experience * 10 + (b.consultationCount || 0) / 100
              return scoreB - scoreA
            })
        }
      },

      // 更改排序方式
      changeSort(type) {
        this.sortType = type
        this.filterConsultants()
      },

      // 筛选相关方法
      selectRating(rating) {
        this.selectedRating = this.selectedRating === rating ? null : rating
      },

      selectExperience(experience) {
        this.selectedExperience = this.selectedExperience === experience ? null : experience
      },

      selectStatus(status) {
        this.selectedStatus = status
      },

      toggleSpecialty(specialty) {
        const index = this.selectedSpecialties.indexOf(specialty)
        if (index > -1) {
          this.selectedSpecialties.splice(index, 1)
        } else {
          this.selectedSpecialties.push(specialty)
        }
      },

      // 通过擅长领域筛选
      filterBySpecialty(specialty) {
        if (!this.selectedSpecialties.includes(specialty)) {
          this.selectedSpecialties.push(specialty)
          this.filterConsultants()
        }
      },

      // 移除筛选条件
      removeFilter(key) {
        switch (key) {
          case 'rating':
            this.selectedRating = null
            break
          case 'experience':
            this.selectedExperience = null
            break
          case 'specialty':
            this.selectedSpecialties = []
            break
          case 'status':
            this.selectedStatus = 'all'
            break
        }
        this.filterConsultants()
      },

      // 清除所有筛选条件
      clearFilters() {
        this.searchKeyword = ''
        this.selectedRating = null
        this.selectedExperience = null
        this.selectedSpecialties = []
        this.selectedStatus = 'all'
        this.filterConsultants()
      },

      // 重置筛选
      resetFilters() {
        this.selectedRating = null
        this.selectedExperience = null
        this.selectedSpecialties = []
        this.selectedStatus = 'all'
      },

      // 应用筛选
      applyFilters() {
        this.showFilter = false
        this.filterConsultants()
      },

      // 关闭筛选弹窗
      closeFilter() {
        this.showFilter = false
      },

      // 更新活动筛选标签
      updateActiveFilters() {
        this.activeFilters = []

        if (this.selectedRating !== null) {
          this.activeFilters.push({
            key: 'rating',
            label: '评分',
            value: `${this.selectedRating}分以上`
          })
        }

        if (this.selectedExperience !== null) {
          this.activeFilters.push({
            key: 'experience',
            label: '经验',
            value: `${this.selectedExperience}年以上`
          })
        }

        if (this.selectedSpecialties.length > 0) {
          this.activeFilters.push({
            key: 'specialty',
            label: '擅长领域',
            value: this.selectedSpecialties.join('、')
          })
        }

        if (this.selectedStatus !== 'all') {
          this.activeFilters.push({
            key: 'status',
            label: '状态',
            value: this.selectedStatus === 'online' ? '在线' : '忙碌'
          })
        }
      },

      // 状态相关方法
      getStatusClass(status) {
        const statusMap = {
          online: 'status-online',
          busy: 'status-busy',
          offline: 'status-offline'
        }
        return statusMap[status] || 'status-offline'
      },

      getStatusText(status) {
        const statusMap = {
          online: '在线',
          busy: '忙碌',
          offline: '离线'
        }
        return statusMap[status] || '离线'
      },

      // 跳转到咨询师详情
      navigateToDetail(id) {
        uni.navigateTo({
          url: `/pages/consultant/detail?id=${id}`
        })
      },

      // 立即咨询
      handleConsult(consultant) {
        console.log('开始免费咨询:', consultant.name)

        // 检查是否在线
        if (consultant.status === 'offline') {
          uni.showToast({
            title: '该咨询师当前不在线',
            icon: 'none'
          })
          return
        }

        uni.showModal({
          title: '免费咨询',
          content: `确定要免费咨询 ${consultant.name} 吗？`,
          success: (res) => {
            if (res.confirm) {
              // 跳转到咨询页面
              uni.navigateTo({
                url: `/pages/message/chat/chat?id=${consultant.id}&name=${encodeURIComponent(consultant.name)}&role=consultant`
              })
            }
          }
        })
      },

      // 返回首页
      navigateBack() {
        uni.navigateBack()
      }
    }
  }
</script>

<style scoped>
  .consultant-list-container {
    background-color: #F5F7FA;
    min-height: 100vh;
    padding-bottom: 120rpx;
  }

  /* 搜索栏样式 */
  .search-section {
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  }

  .search-bar {
    display: flex;
    align-items: center;
    background: #F5F7FA;
    border-radius: 50rpx;
    padding: 20rpx 30rpx;
  }

  .search-bar .uni-icons {
    margin-right: 20rpx;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #333333;
    background: transparent;
  }

  .filter-btn {
    background: transparent;
    border: none;
    font-size: 26rpx;
    color: #666666;
    display: flex;
    align-items: center;
    padding: 0;
    margin-left: 20rpx;
  }

  .filter-btn .uni-icons {
    margin-right: 8rpx;
  }

  /* 筛选标签 */
  .filter-tags {
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid #F0F0F0;
  }

  .filter-scroll {
    white-space: nowrap;
  }

  .filter-tag-list {
    display: flex;
    gap: 20rpx;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    background: #E8F4FF;
    color: #4A90E2;
    font-size: 24rpx;
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    white-space: nowrap;
  }

  .filter-remove {
    margin-left: 10rpx;
    font-size: 28rpx;
    cursor: pointer;
  }

  .filter-clear {
    color: #999999;
    font-size: 24rpx;
    line-height: 44rpx;
    padding-left: 20rpx;
    border-left: 1rpx solid #F0F0F0;
    white-space: nowrap;
  }

  /* 排序区域 */
  .sort-section {
    background: #FFFFFF;
    padding: 30rpx;
  }

  .sort-options {
    display: flex;
    gap: 40rpx;
  }

  .sort-option {
    font-size: 26rpx;
    color: #666666;
    padding: 10rpx 0;
    position: relative;
    cursor: pointer;
  }

  .sort-option.active {
    color: #4A90E2;
    font-weight: bold;
  }

  .sort-option.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: #4A90E2;
    border-radius: 2rpx;
  }

  /* 免费咨询提示 */
  .free-consultant-tip {
    background: #E8F4FF;
    margin: 20rpx 30rpx;
    padding: 20rpx;
    border-radius: 10rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .free-consultant-tip .uni-icons {
    margin-right: 10rpx;
  }

  .tip-text {
    font-size: 24rpx;
    color: #4A90E2;
  }

  /* 咨询师列表 */
  .consultant-list {
    padding: 0 30rpx;
  }

  .consultant-item {
    background: #FFFFFF;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: flex-start;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  }

  .item-left {
    position: relative;
    margin-right: 30rpx;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
  }

  .consultant-status {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 20rpx;
    padding: 4rpx 10rpx;
    border-radius: 20rpx;
    color: #FFFFFF;
  }

  .status-online {
    background: #52C41A;
  }

  .status-busy {
    background: #FAAD14;
  }

  .status-offline {
    background: #999999;
  }

  .item-center {
    flex: 1;
  }

  .consultant-info {
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
    font-size: 26rpx;
    color: #666666;
    margin-bottom: 15rpx;
  }

  .tags {
    display: flex;
    gap: 15rpx;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 15rpx;
  }

  .rating-tag {
    background: #FFF7E6;
    color: #FA8C16;
  }

  .experience-tag {
    background: #F6FFED;
    color: #52C41A;
  }

  .consultation-tag {
    background: #E8F4FF;
    color: #4A90E2;
  }

  .specialty-section {
    margin-bottom: 15rpx;
  }

  .specialty-label {
    font-size: 26rpx;
    color: #333333;
    margin-right: 10rpx;
  }

  .specialty-tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }

  .specialty-tag {
    font-size: 24rpx;
    color: #4A90E2;
    background: #E8F4FF;
    padding: 6rpx 16rpx;
    border-radius: 15rpx;
    margin-bottom: 10rpx;
  }

  .description {
    font-size: 24rpx;
    color: #666666;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-right {
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 15rpx;
  }

  .consult-btn,
  .detail-btn {
    width: 140rpx;
    font-size: 26rpx;
    padding: 15rpx 0;
    border-radius: 30rpx;
    border: none;
    text-align: center;
  }

  .consult-btn {
    background: #4A90E2;
    color: #FFFFFF;
  }

  .detail-btn {
    background: #F5F7FA;
    color: #666666;
    border: 1rpx solid #E0E0E0;
  }

  /* 空状态 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 30rpx;
  }

  .empty-image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: 40rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999999;
    margin-bottom: 40rpx;
  }

  .empty-btn {
    background: #4A90E2;
    color: #FFFFFF;
    font-size: 28rpx;
    padding: 20rpx 40rpx;
    border-radius: 30rpx;
    border: none;
  }

  /* 筛选弹窗 */
  .filter-popup {
    background: #FFFFFF;
    border-radius: 30rpx 30rpx 0 0;
    max-height: 80vh;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #F0F0F0;
  }

  .popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
  }

  .popup-close {
    font-size: 40rpx;
    color: #999999;
  }

  .popup-content {
    max-height: 60vh;
    padding: 30rpx;
  }

  .filter-group {
    margin-bottom: 40rpx;
  }

  .filter-group-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
  }

  .rating-options,
  .experience-options,
  .specialty-options,
  .status-options {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  .rating-option,
  .experience-option,
  .specialty-option,
  .status-option {
    padding: 15rpx 30rpx;
    background: #F5F7FA;
    border-radius: 30rpx;
    font-size: 26rpx;
    color: #666666;
    border: 2rpx solid transparent;
  }

  .rating-option.active,
  .experience-option.active,
  .specialty-option.active,
  .status-option.active {
    background: #E8F4FF;
    color: #4A90E2;
    border-color: #4A90E2;
  }

  .popup-footer {
    display: flex;
    padding: 30rpx;
    border-top: 1rpx solid #F0F0F0;
    gap: 20rpx;
  }

  .reset-btn,
  .confirm-btn {
    flex: 1;
    padding: 25rpx 0;
    font-size: 28rpx;
    border-radius: 30rpx;
    border: none;
  }

  .reset-btn {
    background: #F5F7FA;
    color: #666666;
    border: 1rpx solid #E0E0E0;
  }

  .confirm-btn {
    background: #4A90E2;
    color: #FFFFFF;
  }

  /* 底部导航 */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFFFFF;
    padding: 20rpx 30rpx;
    border-top: 1rpx solid #F0F0F0;
    z-index: 100;
  }

  .back-btn {
    background: #4A90E2;
    color: #FFFFFF;
    font-size: 28rpx;
    padding: 25rpx 0;
    border-radius: 30rpx;
    border: none;
    width: 100%;
  }
</style>
