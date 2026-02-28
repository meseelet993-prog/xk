import config from '@/config/config.js'

// 请求基地址
const BASE_URL = config.baseURL

// 请求拦截器
const requestInterceptor = (options) => {
  // 添加token到header
  const token = uni.getStorageSync('token')
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 记录请求日志
  console.log(`[API Request] ${options.method} ${options.url}`, JSON.stringify(options.data))
  
  return options
}

// 响应拦截器
const responseInterceptor = (response) => {
  console.log(`[API Response] ${response.statusCode}`, response.data)
  
  if (response.statusCode === 200) {
    return response.data
  } else if (response.statusCode === 401) {
    // token过期，跳转到登录页
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.redirectTo({
      url: '/pages/login/login'
    })
    throw new Error('登录已过期，请重新登录')
  } else {
    throw new Error(response.data.message || '请求失败')
  }
}

// 通用请求方法
export const request = (options) => {
  return new Promise((resolve, reject) => {
    const processedOptions = requestInterceptor(options)
    // 构建完整URL，支持GET查询参数
    let fullUrl = BASE_URL + processedOptions.url
    if ((processedOptions.method || 'GET').toUpperCase() === 'GET' && processedOptions.data && Object.keys(processedOptions.data).length > 0) {
      const queryString = Object.keys(processedOptions.data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(processedOptions.data[key])}`)
        .join('&')
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
    }

    uni.request({
      url: fullUrl,
      method: processedOptions.method || 'GET',
      data: (processedOptions.method || 'GET').toUpperCase() === 'GET' ? {} : processedOptions.data,
      header: {
        'Content-Type': 'application/json',
        ...processedOptions.header
      },
      success: (res) => {
        try {
          const data = responseInterceptor(res)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        console.error('[API Error]', error)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

// GET请求
export const get = (url, data = {}) => {
  return request({
    url,
    method: 'GET',
    data
  })
}

// POST请求
export const post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  })
}

// PUT请求
export const put = (url, data = {}) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

// DELETE请求
export const del = (url, data = {}) => {
  return request({
    url,
    method: 'DELETE',
    data
  })
}
