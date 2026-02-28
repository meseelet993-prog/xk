<template>
  <view class="timeline">
    <view 
      v-for="(step, index) in steps" 
      :key="index"
      class="timeline-item"
      :class="{ 'last-item': index === steps.length - 1 }"
    >
      <view class="timeline-dot" :class="step.status"></view>
      <view class="timeline-content">
        <text class="timeline-title">{{ step.title }}</text>
        <text class="timeline-desc">{{ step.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  steps: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.timeline {
  position: relative;
  padding-left: 40rpx;
}

.timeline-item {
  position: relative;
  padding-bottom: 40rpx;
  
  &.last-item {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -40rpx;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #E4E7ED;
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 0 0 2rpx #E4E7ED;
  
  &.success {
    background: #09BB07;
    box-shadow: 0 0 0 2rpx #09BB07;
  }
  
  &.process {
    background: #4A90E2;
    box-shadow: 0 0 0 2rpx #4A90E2;
  }
  
  &.error {
    background: #FF3B30;
    box-shadow: 0 0 0 2rpx #FF3B30;
  }
}

.timeline-content {
  .timeline-title {
    display: block;
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
    margin-bottom: 8rpx;
  }
  
  .timeline-desc {
    display: block;
    font-size: 24rpx;
    color: #999999;
  }
}

.timeline-item:not(.last-item)::after {
  content: '';
  position: absolute;
  left: -32rpx;
  top: 28rpx;
  bottom: -40rpx;
  width: 2rpx;
  background: #E4E7ED;
}
</style>