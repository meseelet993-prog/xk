import config from '@/config/config.js'

class Socket {
  constructor() {
    this.socketTask = null
    this.isConnect = false
    this.reconnectTime = 0
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.messageCallbacks = []
    
    // Default config
    const origin = config.baseURL.replace(/\/api$/, '')
    const wsOrigin = origin.replace(/^http(s?):/, 'ws$1:')
    this.config = {
      wsBase: config.wsBase || wsOrigin, // e.g., ws://localhost:8082
      pingInterval: 30000,
      pongTimeout: 10000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    }
  }

  /**
   * Connect to WebSocket
   * @param {Number|String} userId Current user ID
   */
  connect(userId) {
    if (this.socketTask && this.isConnect) {
      console.log('WebSocket already connected')
      return
    }
    
    // Close existing task if any (e.g. stuck in connecting)
    if (this.socketTask) {
      this.socketTask.close()
    }

    const url = `${this.config.wsBase}/api/ws/chat/${userId}`
    console.log('正在连接 WebSocket:', url)
    
    this.socketTask = uni.connectSocket({
      url: url,
      success: () => {
        console.log('WebSocket 连接请求发送成功')
      },
      fail: (err) => {
        console.error('WebSocket 连接失败', err)
      }
    })

    this.initListeners()
  }

  initListeners() {
    if (!this.socketTask) return

    this.socketTask.onOpen(() => {
      console.log('WebSocket connected')
      this.isConnect = true
      this.reconnectTime = 0
      this.startHeartbeat()
      
      // Dispatch event
      uni.$emit('socketOpen')
    })

    this.socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        this.handleMessage(data)
      } catch (e) {
        console.error('Failed to parse message', e)
      }
    })

    this.socketTask.onError((err) => {
      console.error('WebSocket error', err)
      this.isConnect = false
      this.reconnect()
    })

    this.socketTask.onClose(() => {
      console.log('WebSocket closed')
      this.isConnect = false
      this.stopHeartbeat()
      this.reconnect()
    })
  }

  handleMessage(data) {
    // Heartbeat response
    if (data.type === 'pong') {
      return
    }

    // Notify listeners
    this.messageCallbacks.forEach(callback => callback(data))
    
    // Global event
    uni.$emit('socketMessage', data)
  }

  send(data) {
    // 关键：发送前检查 socket 是否存在且已连接
    if (!this.isConnect || !this.socketTask) {
      console.error('WebSocket 未连接，无法发送消息')
      return false
    }

    this.socketTask.send({
      data: JSON.stringify(data),
      success: () => {
        console.log('消息发送成功')
      },
      fail: (err) => {
        console.error('消息发送失败', err)
      }
    })
    return true
  }

  close() {
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    this.isConnect = false
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
  }

  reconnect() {
    if (this.isConnect) return
    if (this.reconnectTime >= this.config.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectTime++
    console.log(`Reconnecting... Attempt ${this.reconnectTime}`)
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    
    this.reconnectTimer = setTimeout(() => {
      const userInfo = uni.getStorageSync('userInfo')
      const userId = userInfo && userInfo.id
      if (userId) {
        this.connect(userId)
      }
    }, this.config.reconnectInterval)
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnect) {
        this.send({ type: 'ping' })
      }
    }, this.config.pingInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  onMessage(callback) {
    this.messageCallbacks.push(callback)
  }
}

export default new Socket()
