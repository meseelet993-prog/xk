<template>
  <view class="message-bubble" :class="{ own: isOwn }">
    <view class="bubble-content">
      <text class="message-text">{{ message.content }}</text>
    </view>
    <text class="message-time">{{ formatTime(message.time) }}</text>
  </view>
</template>

<script setup>
import { formatChatTime } from '@/utils/time.js'

defineProps({
  message: {
    type: Object,
    required: true
  },
  isOwn: {
    type: Boolean,
    default: false
  }
})

const formatTime = (timestamp) => {
  return formatChatTime(timestamp)
}
</script>

<style scoped>
.message-bubble {
  margin-bottom: 24rpx;
  
  &.own {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .bubble-content {
      background: #4A90E2;
      border-radius: 20rpx 20rpx 4rpx 20rpx;
      
      .message-text {
        color: #FFFFFF;
      }
    }
  }
  
  &:not(.own) {
    .bubble-content {
      background: #FFFFFF;
      border-radius: 20rpx 20rpx 20rpx 4rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
      
      .message-text {
        color: #333333;
      }
    }
  }
}

.bubble-content {
  padding: 20rpx 24rpx;
  max-width: 500rpx;
  display: inline-block;
  
  .message-text {
    font-size: 28rpx;
    line-height: 1.4;
  }
}

.message-time {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}
</style>