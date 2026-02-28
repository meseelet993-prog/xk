import { get, post, put } from './request'

/**
 * 获取会话列表
 */
export const getConversations = () => {
  return get('/messages/conversations')
}

/**
 * 获取聊天消息
 */
export const getMessages = (conversationId) => {
  return get(`/messages/conversations/${conversationId}/messages`)
}

/**
 * 获取聊天历史记录
 */
export const getChatHistory = (userId1, userId2) => {
  return get('/chat/history', { userId1, userId2 })
}

/**
 * 发送消息
 */
export const sendMessage = (conversationId, data) => {
  return post(`/messages/conversations/${conversationId}/messages`, data)
}

/**
 * 标记消息为已读
 */
export const markAsRead = (conversationId) => {
  return put(`/messages/conversations/${conversationId}/read`)
}
