<template>
  <view class="consultant-card" @click="$emit('click')">
    <image :src="consultant.avatar" class="avatar" mode="aspectFill" />
    <view class="info">
      <text class="name">{{ consultant.name }}</text>
      <text class="title">{{ consultant.title }}</text>
      <view class="specialty">
        <text 
          v-for="(item, index) in consultant.specialty" 
          :key="index"
          class="specialty-tag"
        >
          {{ item }}
        </text>
      </view>
      <view class="meta">
        <text class="rating">⭐ {{ consultant.rating }}</text>
        <text class="experience">{{ consultant.experience }}年经验</text>
      </view>
      <view class="price">¥{{ consultant.price }}/小时</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  consultant: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>

<style scoped>
.consultant-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  width: 280rpx;
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

.price {
  font-size: 28rpx;
  color: #FF6B35;
  font-weight: bold;
}
</style>