/**
 * 设置存储数据
 */
export const setStorage = (key, value) => {
  try {
    uni.setStorageSync(key, value)
    return true
  } catch (error) {
    console.error('存储数据失败:', error)
    return false
  }
}

/**
 * 获取存储数据
 */
export const getStorage = (key) => {
  try {
    return uni.getStorageSync(key)
  } catch (error) {
    console.error('获取存储数据失败:', error)
    return null
  }
}

/**
 * 移除存储数据
 */
export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (error) {
    console.error('移除存储数据失败:', error)
    return false
  }
}

/**
 * 清空所有存储
 */
export const clearStorage = () => {
  try {
    uni.clearStorageSync()
    return true
  } catch (error) {
    console.error('清空存储失败:', error)
    return false
  }
}