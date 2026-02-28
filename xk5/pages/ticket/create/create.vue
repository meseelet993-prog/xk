<template>
  <view class="create-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-left" @click="handleBack">
        <text class="back-icon">‹</text>
        <text>返回</text>
      </view>
      <text class="nav-title">创建工单</text>
      <view class="nav-right">
        <text class="submit-btn" @click="handleSubmit" :class="{ disabled: submitting || !canSubmit }">
          {{ submitting ? '提交中...' : '提交' }}
        </text>
      </view>
    </view>

    <!-- 表单内容 -->
    <scroll-view class="form-content" scroll-y>
      <view class="form-section">
        <view class="form-item">
          <text class="label required">标题</text>
          <input class="input" type="text" placeholder="请输入工单标题" v-model="form.title" maxlength="100" />
          <text class="counter">{{ form.title.length }}/100</text>
        </view>

        <view class="form-item">
          <text class="label required">详细描述</text>
          <textarea class="textarea" placeholder="请详细描述您的问题..." v-model="form.content" maxlength="2000" />
          <text class="counter">{{ form.content.length }}/2000</text>
        </view>

        <view class="form-item">
          <text class="label required">问题分类</text>
          <picker class="picker" :range="categoryOptions" range-key="label" @change="onCategoryChange">
            <view class="picker-content">
              <text>{{ selectedCategory.label || '请选择问题分类' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="label">紧急程度</text>
          <view class="priority-buttons">
            <view v-for="priority in priorityOptions" :key="priority.value" class="priority-btn" :class="{ 
                active: form.priority === priority.value,
                [priority.value.toLowerCase()]: form.priority === priority.value
              }" @click="form.priority = priority.value">
              <text>{{ priority.label }}</text>
            </view>
          </view>
        </view>

        <!-- 匿名选项 -->
        <view class="form-item">
          <view class="anonymous-option">
            <switch :checked="form.isAnonymous" @change="onAnonymousChange" color="#4A90E2" />
            <text class="anonymous-text">匿名咨询</text>
            <text class="anonymous-tip">选择匿名后，咨询师将不会看到您的个人信息</text>
          </view>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tip-section">
        <text class="tip-title">温馨提示</text>
        <text class="tip-content">
          1. 请详细描述您的问题，以便咨询师更好地帮助您
          2. 工单提交后，咨询师会在24小时内处理
          3. 如需紧急帮助，请选择高优先级
          4. 所有咨询内容都会严格保密
        </text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
  // 导入修复后的 http 工具
  import http from '@/utils/http.js'

  // 导入 ticketApi 中的相关函数
  import {
    createTicket
  } from '../../../api/ticketApi.js'

  export default {
    data() {
      return {
        form: {
          title: '',
          content: '',
          category: '',
          priority: 'MEDIUM',
          isAnonymous: false
        },
        categoryOptions: [{
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
        ],
        selectedCategory: {},
        submitting: false,
        userInfo: {}
      }
    },

    onLoad() {
      this.loadUserInfo()
    },

    computed: {
      canSubmit() {
        return this.form.title.trim() &&
          this.form.content.trim() &&
          this.form.category &&
          !this.submitting
      }
    },

    methods: {
      loadUserInfo() {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo) {
          // 确保studentId为数字类型
          this.userInfo = {
            ...userInfo,
            id: Number(userInfo.id) || 0
          }
        } else {
          // 如果没有用户信息，跳转到登录页面
          uni.showModal({
            title: '提示',
            content: '请先登录',
            showCancel: false,
            success: () => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }
          })
        }
      },

      handleBack() {
        // 检查表单是否有内容，提示用户
        if (this.form.title || this.form.content) {
          uni.showModal({
            title: '提示',
            content: '确定要返回吗？未保存的内容将会丢失。',
            success: (res) => {
              if (res.confirm) {
                uni.navigateBack()
              }
            }
          })
        } else {
          uni.navigateBack()
        }
      },

      onCategoryChange(e) {
        const index = e.detail.value
        this.selectedCategory = this.categoryOptions[index]
        this.form.category = this.selectedCategory.value
      },

      onAnonymousChange(e) {
        this.form.isAnonymous = e.detail.value
      },

      // 提交表单
      async handleSubmit() {
        if (!this.canSubmit) {
          if (!this.form.title.trim()) {
            uni.showToast({
              title: '请输入标题',
              icon: 'none'
            })
          } else if (!this.form.content.trim()) {
            uni.showToast({
              title: '请输入详细描述',
              icon: 'none'
            })
          } else if (!this.form.category) {
            uni.showToast({
              title: '请选择问题分类',
              icon: 'none'
            })
          }
          return
        }

        this.submitting = true

        try {
          // 提交工单数据
          const formData = {
            title: this.form.title.trim(),
            content: this.form.content.trim(),
            category: this.form.category,
            priority: this.form.priority,
            isAnonymous: this.form.isAnonymous,
            studentId: Number(this.userInfo.id) // 确保为long类型
          }

          // 验证studentId是否为有效的数字
          if (!formData.studentId || isNaN(formData.studentId)) {
            console.log('数据：', formData)
            throw new Error('用户信息错误，请重新登录')

          }

          // 调用 ticketApi 中的创建工单函数
          const response = await createTicket(formData)
          console.log('创建工单响应:', response)

          // 判断响应是否成功 - 支持多种响应格式
          let isSuccess = false
          let successMessage = '提交成功'

          // 情况1：标准格式 { code: 200, data: {...}, message: '...' }
          if (response && (response.code === 200 || response.code === 0)) {
            isSuccess = true
            successMessage = response.message || '提交成功'
          }
          // 情况2：直接返回工单对象（Spring Boot 默认）
          else if (response && response.id && response.ticketNo) {
            isSuccess = true
            successMessage = '工单创建成功'
          }
          // 情况3：其他可能的成功格式
          else if (response && response.success !== false) {
            isSuccess = true
            successMessage = response.message || '操作成功'
          }

          if (isSuccess) {
            uni.showToast({
              title: successMessage,
              icon: 'success',
              duration: 2000
            })

            // 触发全局更新事件，让列表页面刷新
            uni.$emit('ticket-updated')

            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              uni.redirectTo({
                url: '/pages/ticket/list/list'
              })
            }, 2000)
          } else {
            uni.showToast({
              title: response?.message || '提交失败，请重试',
              icon: 'none',
              duration: 3000
            })
          }
        } catch (error) {
          console.error('提交失败:', error)
          uni.showToast({
            title: error.message || '提交失败，请检查网络后重试',
            icon: 'none',
            duration: 3000
          })
        } finally {
          this.submitting = false
        }
      }
    }
  }
</script>

<style scoped>
  .create-container {
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
    padding: 10rpx 20rpx;
    border-radius: 8rpx;
  }

  .nav-left:active {
    background-color: rgba(74, 144, 226, 0.1);
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

  .nav-right .submit-btn {
    color: #4A90E2;
    font-size: 28rpx;
    font-weight: 500;
    padding: 10rpx 20rpx;
    border-radius: 8rpx;
  }

  .nav-right .submit-btn:not(.disabled):active {
    background-color: rgba(74, 144, 226, 0.1);
  }

  .nav-right .submit-btn.disabled {
    color: #CCCCCC;
  }

  .form-content {
    flex: 1;
    padding: 40rpx 30rpx;
  }

  .form-section {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 40rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  }

  .form-item {
    margin-bottom: 40rpx;
  }

  .form-item:last-child {
    margin-bottom: 0;
  }

  .label {
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
    display: block;
    margin-bottom: 20rpx;
  }

  .label.required::after {
    content: '*';
    color: #FF4D4F;
    margin-left: 4rpx;
  }

  .input,
  .textarea,
  .picker-content {
    border: 2rpx solid #E0E0E0;
    border-radius: 12rpx;
    padding: 24rpx;
    font-size: 28rpx;
    color: #333333;
    background: #ffffff;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  .input:focus,
  .textarea:focus {
    border-color: #4A90E2;
  }

  .input {
    height: 88rpx;
  }

  .textarea {
    height: 300rpx;
    line-height: 1.5;
  }

  .picker-content {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .arrow {
    color: #999999;
    font-size: 24rpx;
  }

  .counter {
    display: block;
    text-align: right;
    font-size: 24rpx;
    color: #999999;
    margin-top: 10rpx;
  }

  .priority-buttons {
    display: flex;
    gap: 20rpx;
  }

  .priority-btn {
    flex: 1;
    height: 80rpx;
    border: 2rpx solid #E0E0E0;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #666666;
    transition: all 0.3s;
    background: #F8F9FA;
  }

  .priority-btn:active {
    transform: scale(0.98);
  }

  .priority-btn.active {
    color: #ffffff;
    font-weight: 600;
    transform: scale(1);
  }

  .priority-btn.low.active {
    background: #28A745;
    border-color: #28A745;
  }

  .priority-btn.medium.active {
    background: #FFC107;
    border-color: #FFC107;
  }

  .priority-btn.high.active {
    background: #DC3545;
    border-color: #DC3545;
  }

  .anonymous-option {
    display: flex;
    align-items: center;
    padding: 10rpx 0;
  }

  .anonymous-text {
    font-size: 28rpx;
    color: #333333;
    margin-left: 20rpx;
    margin-right: 20rpx;
  }

  .anonymous-tip {
    flex: 1;
    font-size: 24rpx;
    color: #999999;
  }

  .tip-section {
    background: #FFF9E6;
    border-radius: 20rpx;
    padding: 40rpx;
    border-left: 8rpx solid #FFC107;
  }

  .tip-title {
    font-size: 28rpx;
    color: #333333;
    font-weight: 600;
    display: block;
    margin-bottom: 20rpx;
  }

  .tip-content {
    font-size: 26rpx;
    color: #666666;
    line-height: 1.6;
    display: block;
  }

  .tip-content text {
    display: block;
    margin-bottom: 8rpx;
  }
</style>