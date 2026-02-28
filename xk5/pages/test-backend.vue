<template>
  <view class="test-container">
    <view class="header">
      <text class="title">后端连接测试</text>
    </view>

    <view class="test-buttons">
      <button @click="testConnection">测试后端连接</button>
      <button @click="testCreateTicket">测试创建工单</button>
      <button @click="testGetTickets">测试获取工单列表</button>
    </view>

    <view class="results">
      <text class="result-title">测试结果：</text>
      <text class="result-text">{{ testResult }}</text>
    </view>

    <view class="request-details">
      <text class="detail-title">请求详情：</text>
      <text class="detail-text">{{ requestDetails }}</text>
    </view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        testResult: '',
        requestDetails: '',
        userInfo: {}
      }
    },

    onLoad() {
      this.loadUserInfo()
    },

    methods: {
      loadUserInfo() {
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo) {
          this.userInfo = userInfo
        }
      },

      async testConnection() {
        try {
          this.testResult = '正在测试后端连接...'

          // 测试基本连接
          const response = await fetch('http://localhost:8082')
            .then(res => {
              return {
                status: res.status,
                ok: res.ok,
                url: res.url
              }
            })
            .catch(err => {
              throw new Error(`无法连接到后端: ${err.message}`)
            })

          this.testResult = `后端连接成功！状态码: ${response.status}`
          this.requestDetails = `URL: ${response.url}`

        } catch (error) {
          this.testResult = `连接失败: ${error.message}`
          this.requestDetails = '请确保后端服务正在运行在 http://localhost:8082'
        }
      },

      async testCreateTicket() {
        try {
          this.testResult = '正在测试创建工单接口...'

          // 准备测试数据
          const testData = {
            studentId: this.userInfo.id || 1,
            title: '测试工单标题',
            content: '这是一个测试工单的内容',
            category: 'STUDY',
            priority: 'MEDIUM',
            isAnonymous: false,
            attachments: []
          }

          this.requestDetails = `请求数据: ${JSON.stringify(testData, null, 2)}`

          // 使用原生 fetch 测试
          const response = await fetch('http://localhost:8082/api/tickets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(testData)
          })

          const responseText = await response.text()
          let responseData
          try {
            responseData = JSON.parse(responseText)
          } catch {
            responseData = responseText
          }

          if (response.ok) {
            this.testResult = `创建工单成功！状态码: ${response.status}`
          } else {
            this.testResult = `创建工单失败！状态码: ${response.status}`
          }

          this.requestDetails +=
            `\n响应状态: ${response.status} ${response.statusText}\n响应内容: ${JSON.stringify(responseData, null, 2)}`

        } catch (error) {
          this.testResult = `测试失败: ${error.message}`
        }
      },

      async testGetTickets() {
        try {
          this.testResult = '正在测试获取工单列表...'

          const response = await fetch('http://localhost:8082/api/tickets')
            .then(res => res.text())
            .then(text => {
              try {
                return JSON.parse(text)
              } catch {
                return text
              }
            })

          this.testResult = '获取工单列表请求已发送'
          this.requestDetails = `响应: ${JSON.stringify(response, null, 2)}`

        } catch (error) {
          this.testResult = `获取失败: ${error.message}`
        }
      }
    }
  }
</script>

<style scoped>
  .test-container {
    padding: 40rpx;
  }

  .header {
    margin-bottom: 40rpx;
  }

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }

  .test-buttons {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 40rpx;
  }

  .test-buttons button {
    background-color: #4A90E2;
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx;
    font-size: 28rpx;
  }

  .results,
  .request-details {
    background-color: #f5f5f5;
    border-radius: 8rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
  }

  .result-title,
  .detail-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 10rpx;
  }

  .result-text,
  .detail-text {
    font-size: 26rpx;
    color: #666;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>