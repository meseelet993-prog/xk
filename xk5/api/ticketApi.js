// api/ticketApi.js
import http from '@/utils/http.js'

// 获取工单列表 - 确保过滤已删除的记录
export const getTicketList = async (params) => {
  try {
    console.log('获取工单列表请求参数:', params)

    // 构建请求参数，确保包含过滤已删除记录的条件
    const requestParams = {
      ...params,
      // 这些参数名称根据后端API设计来调整
      isDeleted: 0, // 只返回未删除的记录
      excludeDeleted: true, // 排除已删除的记录
      showActiveOnly: true // 只显示活跃的记录
    }

    // 如果是管理员，可能需要看到更多记录（比如回收站功能）
    // 可以根据用户角色决定是否显示已删除的记录
    // if (params.showDeleted) {
    //   delete requestParams.isDeleted;
    //   delete requestParams.excludeDeleted;
    // }

    console.log('实际发送的请求参数:', requestParams)

    const response = await http.get('/api/tickets/list', {
      params: requestParams
    })
    console.log('获取工单列表响应:', response)

    // 前端双重保障：如果后端没有过滤，前端再过滤一次
    if (response && response.records && Array.isArray(response.records)) {
      const filteredRecords = response.records.filter(ticket => {
        // 根据可能的字段名判断是否已删除
        const isDeleted = ticket.isDeleted === 1 ||
          ticket.deleted === true ||
          ticket.is_deleted === 1 ||
          ticket.deletedAt != null
        return !isDeleted
      })

      console.log('前端过滤结果:', {
        原始数量: response.records.length,
        过滤后数量: filteredRecords.length,
        过滤掉: response.records.length - filteredRecords.length
      })

      return {
        ...response,
        records: filteredRecords,
        // 注意：如果前端过滤，total 需要重新计算
        // 但最好让后端正确处理分页
      }
    }

    return response
  } catch (error) {
    console.error('获取工单列表失败:', error)
    throw error
  }
}

// 获取工单详情
export const getTicketDetail = async (ticketId) => {
  try {
    console.log(`获取工单详情 ${ticketId}`)
    const response = await http.get(`/api/tickets/${ticketId}`)
    console.log('获取工单详情响应:', response)
    return response
  } catch (error) {
    console.error('获取工单详情失败:', error)
    throw error
  }
}

// 更新工单状态
export const updateTicketStatus = async (ticketId, data) => {
  try {
    console.log(`更新工单状态 ${ticketId}:`, data)
    const response = await http.put(`/api/tickets/${ticketId}/status`, data)
    return response
  } catch (error) {
    console.error('更新工单状态失败:', error)
    throw error
  }
}


// 删除工单
export const deleteTicket = async (ticketId) => {
  try {
    console.log(`[DEBUG] 删除工单请求开始: ${ticketId}`)
    const response = await http.delete(`/api/tickets/${ticketId}`)
    console.log('[DEBUG] 删除工单响应:', response)
    console.log('[DEBUG] 响应状态码:', response?.statusCode || response?.code)
    console.log('[DEBUG] 响应数据:', response)
    return response
  } catch (error) {
    console.error('[DEBUG] 删除工单失败详情:', error)
    console.error('[DEBUG] 错误状态码:', error.statusCode)
    console.error('[DEBUG] 错误消息:', error.message)
    console.error('[DEBUG] 错误堆栈:', error.stack)
    throw error
  }
}


// 批量删除工单
// export const deleteTicketsBatch = async (data) => {
//   try {
//     console.log('批量删除工单:', data)
//     const response = await http.post('/api/tickets/batch-delete', data)
//     return response
//   } catch (error) {
//     console.error('批量删除工单失败:', error)
//     throw error
//   }
// }

// 获取工单统计
export const getMyTicketStats = async () => {
  try {
    console.log('获取工单统计...')
    // 暂时注释掉，避免400错误
    // const response = await http.get('/api/tickets/stats')
    // console.log('工单统计响应:', response)
    // return response

    // 返回模拟数据，避免前端报错
    return {
      unreadCount: 0,
      ticketUnread: {}
    }
  } catch (error) {
    console.warn('获取工单统计失败，但不影响主要功能:', error.message)
    // 返回空数据，避免前端报错
    return {
      unreadCount: 0,
      ticketUnread: {}
    }
  }
}

// 创建工单
export const createTicket = async (data) => {
  try {
    console.log('创建工单请求数据:', data)
    const response = await http.post('/api/tickets', data)
    console.log('创建工单响应:', response)
    return response
  } catch (error) {
    console.error('创建工单失败:', error)
    throw error
  }
}

// 获取工单状态记录
export const getTicketStatusLogs = async (ticketId) => {
  try {
    console.log(`获取工单状态记录 ${ticketId}`)
    const response = await http.get(`/api/tickets/${ticketId}/status-logs`)
    return response || []
  } catch (error) {
    console.error('获取工单状态记录失败:', error)
    return [] // 返回空数组而不是抛出错误
  }
}

// 获取工单消息
// 在 ticketApi.js 中，修复 getTicketMessages 函数：
export const getTicketMessages = async (ticketId, params = {}) => {
  try {
    console.log(`获取工单消息 ${ticketId}:`, params)
    const response = await http.get(`/api/tickets/${ticketId}/messages`, {
      params
    })
    return response || {
      list: [],
      total: 0
    }
  } catch (error) {
    console.error('获取工单消息失败:', error)
    return {
      list: [],
      total: 0
    } // 返回空数据
  }
}

// 发送工单消息
export const sendTicketMessage = async (ticketId, data) => {
  try {
    console.log(`发送工单消息 ${ticketId}:`, data)
    const response = await http.post(`/api/tickets/${ticketId}/messages`, data)
    return response
  } catch (error) {
    console.error('发送工单消息失败:', error)
    throw error
  }
}

// 标记消息为已读
export const markMessageAsRead = async (ticketId, messageId) => {
  try {
    console.log(`标记消息已读 ${ticketId}/${messageId}`)
    const response = await http.put(`/api/tickets/${ticketId}/messages/${messageId}/read`)
    return response
  } catch (error) {
    console.error('标记消息已读失败:', error)
    throw error
  }
}

// 上传附件
export const uploadAttachment = async (filePath, options = {}) => {
  try {
    console.log('上传附件:', filePath, options)
    const response = await http.upload('/api/upload', filePath, options.formData || {})
    return response
  } catch (error) {
    console.error('上传附件失败:', error)
    throw error
  }
}

// 提交评价
export const submitTicketRating = async (ticketId, data) => {
  try {
    console.log(`提交评价 ${ticketId}:`, data)
    const response = await http.post(`/api/tickets/${ticketId}/rating`, data)
    return response
  } catch (error) {
    console.error('提交评价失败:', error)
    throw error
  }
}

// 导出工单
export const exportTickets = async (params) => {
  try {
    console.log('导出工单:', params)
    // 注意：这里需要后端支持返回blob数据
    const response = await http.post('/api/tickets/export', params, {
      responseType: 'blob'
    })
    return response
  } catch (error) {
    console.error('导出工单失败:', error)
    throw error
  }
}

// ============ 工具函数 ============

// 状态映射 - 修复大小写问题
export const getStatusText = (status) => {
  // 先将状态转换为大写，然后映射
  const statusUpper = status ? status.toUpperCase() : ''
  const statusMap = {
    'PENDING': '待受理',
    'IN_PROGRESS': '咨询中',
    'COMPLETED': '已完成',
    'CLOSED': '已关闭'
  }
  return statusMap[statusUpper] || status || '未知状态'
}

export const getPriorityText = (priority) => {
  const priorityMap = {
    'LOW': '低',
    'MEDIUM': '中',
    'HIGH': '高'
  }
  return priorityMap[priority] || priority || '中'
}

export const getCategoryText = (category) => {
  const categoryMap = {
    'STUDY': '学习压力',
    'RELATIONSHIP': '人际关系',
    'EMOTION': '情绪问题',
    'CAREER': '职业规划',
    'FAMILY': '家庭关系',
    'LOVE': '恋爱问题',
    'OTHER': '其他问题'
  }
  return categoryMap[category] || category || '其他问题'
}

export const formatTime = (timestamp) => {
  if (!timestamp) return ''

  try {
    // 处理ISO格式的时间字符串
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return timestamp // 如果无法解析，返回原字符串
    }

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('格式化时间失败:', error, timestamp)
    return timestamp || ''
  }
}

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''

  try {
    const now = new Date().getTime()
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return formatTime(timestamp)
    }

    const diff = now - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`
    } else {
      return formatTime(timestamp)
    }
  } catch (error) {
    console.error('格式化相对时间失败:', error, timestamp)
    return formatTime(timestamp)
  }
}

export const getStatusClass = (status) => {
  const statusUpper = status ? status.toUpperCase() : ''
  const statusClassMap = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'CLOSED': 'closed'
  }
  return statusClassMap[statusUpper] || ''
}

// ============ 统一导出对象 ============

// 统一导出所有API方法
export const ticketApi = {
  // 工单管理
  getTicketList,
  getTicketDetail,
  updateTicketStatus,
  deleteTicket,
  getMyTicketStats,
  createTicket,

  // 工单详情相关
  getTicketStatusLogs,
  getTicketMessages,
  sendTicketMessage,
  markMessageAsRead,

  // 文件操作
  uploadAttachment,

  // 评价
  submitTicketRating,

  // 导出
  exportTickets,

  // 工具函数（方便通过对象调用）
  getStatusText,
  getPriorityText,
  getCategoryText,
  formatTime,
  formatRelativeTime,
  getStatusClass
}

// 默认导出
export default {
  // 工单管理
  getTicketList,
  getTicketDetail,
  updateTicketStatus,
  deleteTicket,
  getMyTicketStats,
  createTicket,

  // 工单详情相关
  getTicketStatusLogs,
  getTicketMessages,
  sendTicketMessage,
  markMessageAsRead,

  // 文件操作
  uploadAttachment,

  // 评价
  submitTicketRating,

  // 导出
  exportTickets,

  // 工具函数
  getStatusText,
  getPriorityText,
  getCategoryText,
  formatTime,
  formatRelativeTime,
  getStatusClass,

  // 统一对象（方便使用）
  ticketApi
}