/**
 * 格式化时间
 */
export const formatTime = (timestamp, format = 'YYYY-MM-DD HH:mm') => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 相对时间显示
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatTime(timestamp, 'MM-DD HH:mm')
}

/**
 * 聊天时间显示
 */
export const formatChatTime = (timestamp) => {
  const now = new Date()
  const date = new Date(timestamp)
  
  // 如果是今天，显示时间
  if (date.toDateString() === now.toDateString()) {
    return formatTime(timestamp, 'HH:mm')
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${formatTime(timestamp, 'HH:mm')}`
  }
  
  // 如果是今年
  if (date.getFullYear() === now.getFullYear()) {
    return formatTime(timestamp, 'MM-DD HH:mm')
  }
  
  // 其他情况显示完整时间
  return formatTime(timestamp, 'YYYY-MM-DD HH:mm')
}