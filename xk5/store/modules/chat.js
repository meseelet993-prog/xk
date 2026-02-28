import socket from '@/utils/socket'
import { getConversations, getChatHistory, markAsRead } from '@/api/messageApi'

const chat = {
  namespaced: true,
  
  state: {
    isConnected: false,
    conversations: [],
    currentConversationId: null,
    messages: {}, // Map: conversationId -> [messages]
    unreadTotal: 0
  },

  mutations: {
    SET_CONNECTION_STATUS(state, status) {
      state.isConnected = status
    },
    SET_CONVERSATIONS(state, conversations) {
      state.conversations = conversations
      // Calculate total unread
      state.unreadTotal = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
    },
    SET_MESSAGES(state, { conversationId, messages }) {
      // Use Vue.set or simple assignment if Vue 3 (UniApp Vue 3 uses Proxy)
      state.messages[conversationId] = messages
    },
    ADD_MESSAGE(state, { conversationId, message, targetUser = null }) {
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }
      state.messages[conversationId].push(message)
      
      // Update last message in conversation list
      let conv = state.conversations.find(c => c.id == conversationId)
      if (conv) {
        conv.lastMessage = message.content
        conv.lastTime = message.time
        if (message.sender !== 'me' && message.status !== 'read') { 
           // Logic handled in action usually
        }
      } else if (targetUser) {
        // Create new conversation if not exists
        const newConv = {
          id: conversationId,
          name: targetUser.name || '未知用户',
          avatar: targetUser.avatar || '/static/images/avatars/default.png',
          role: targetUser.role || 'student',
          lastMessage: message.content,
          lastTime: message.time,
          unreadCount: 0,
          status: targetUser.status || 'offline'
        }
        state.conversations.unshift(newConv)
      }
    },
    SET_CURRENT_CONVERSATION(state, id) {
      state.currentConversationId = id
    },
    UPDATE_UNREAD_COUNT(state, { conversationId, count }) {
      const conv = state.conversations.find(c => c.id == conversationId)
      if (conv) {
        conv.unreadCount = count
      }
      state.unreadTotal = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    },
    REMOVE_CONVERSATION(state, conversationId) {
      state.conversations = state.conversations.filter(c => c.id !== conversationId)
      state.unreadTotal = state.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
    }
  },

  actions: {
    // Initialize WebSocket connection
    initWebSocket({ commit, dispatch }) {
      const storedUser = uni.getStorageSync('userInfo')
      const userId = storedUser && storedUser.id
      console.log('initWebSocket check:', { userId })
      
      if (!userId) {
        console.error('WebSocket init failed: No userId found')
        return
      }

      socket.connect(userId)
      
      uni.$on('socketOpen', () => {
        console.log('Vuex: Socket connected')
        commit('SET_CONNECTION_STATUS', true)
      })

      uni.$on('socketMessage', (data) => {
        dispatch('handleReceiveMessage', data)
      })
      
      uni.$on('socketClose', () => {
        console.log('Vuex: Socket closed')
        commit('SET_CONNECTION_STATUS', false)
      })
    },

    // Close connection
    closeWebSocket({ commit }) {
      socket.close()
      commit('SET_CONNECTION_STATUS', false)
    },
    
    // Delete conversation
    async deleteConversation({ commit }, conversationId) {
      // In a real app, you would call an API here
      commit('REMOVE_CONVERSATION', conversationId)
    },

    // Load conversation list
    async getConversationList({ commit }) {
      try {
        // const res = await getConversations()
        // Mocking for now as API might not be ready
        // In real impl: commit('SET_CONVERSATIONS', res.data)
        
        // Use existing mock logic from list.vue for now, or wait for real API
        // For now, let's assume we want to use the API structure.
        // We will keep the mock data in the component for a moment or move it here.
        // Let's implement real API call structure
        const res = await getConversations()
        if (res.success) {
           commit('SET_CONVERSATIONS', res.data)
        }
      } catch (e) {
        console.error('Failed to load conversations', e)
      }
    },

    // Load messages for a conversation
    async getConversationMessages({ commit, rootState }, conversationId) {
      try {
        const userId1 = rootState.userInfo && rootState.userInfo.id
        if (!userId1) {
          console.error('获取聊天记录失败: 缺少当前用户ID')
          return
        }
        
        const userId2 = conversationId
        const res = await getChatHistory(userId1, userId2)
        if (res.success) {
          commit('SET_MESSAGES', { 
            conversationId, 
            messages: res.data 
          })
        }
      } catch (e) {
        console.error('Failed to load messages', e)
      }
    },

    // Send a message
    sendMessage({ commit, rootState }, { conversationId, content, type = 'text' }) {
      const payload = {
        receiverId: conversationId,
        content,
        type
      }
      
      // Send via WebSocket
      const success = socket.send(payload)
      
      if (success) {
        // Optimistic update
        const localMsg = {
          id: Date.now(),
          content,
          type,
          sender: (rootState.userInfo && rootState.userInfo.id) || 'me',
          time: Date.now(),
          status: 'sending'
        }
        commit('ADD_MESSAGE', { conversationId, message: localMsg })
        return true
      }
      return false
    },

    // Handle received message
    handleReceiveMessage({ commit, state, rootState }, data) {
      // Expecting server payload: { id, senderId, receiverId, content, type, time }
      if (!data) return
      
      const currentUserId = rootState.userInfo && rootState.userInfo.id
      const conversationId = currentUserId === data.senderId ? data.receiverId : data.senderId
      
      const message = {
        id: data.id,
        content: data.content,
        sender: data.senderId,
        type: data.type || 'text',
        time: data.time || Date.now(),
        status: 'read'
      }
      
      commit('ADD_MESSAGE', { conversationId, message })
      
      if (state.currentConversationId != conversationId) {
        // Optionally update unread counts here
      }
    }
  }
}

export default chat
