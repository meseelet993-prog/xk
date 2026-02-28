const BASE_URL = 'http://localhost:8082'

// 获取token
const getToken = () => {
  try {
    return uni.getStorageSync('token')
  } catch (error) {
    return null
  }
}

// 基本请求函数
const request = (options) => {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      params = {},
      header = {},
      loading = true
    } = options

    // 显示loading
    if (loading) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }

    // 构建完整URL
    let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`

    // 处理GET请求的查询参数
    if (method.toUpperCase() === 'GET' && Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
    }

    // 设置请求头
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...header
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 发起请求
    uni.request({
      url: fullUrl,
      method,
      data: method.toUpperCase() === 'GET' ? {} : data,
      header: headers,
      success: (res) => {
        if (loading) {
          uni.hideLoading()
        }

        const {
          statusCode,
          data: responseData
        } = res

        if (statusCode === 200) {
          // 处理多种响应格式
          // 1. 标准格式：{ code: 200, data: ..., message: ... }
          // 2. 直接返回数据格式：直接返回业务数据
          // 3. Spring Boot 默认格式：{ id: ..., name: ... }

          // 如果有 code 字段，且不为成功状态码
          if (responseData.hasOwnProperty('code') && responseData.code !== 200 && responseData.code !== 0) {
            uni.showToast({
              title: responseData.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(responseData.message || '请求失败'))
            return
          }

          // 如果有 code 字段且为成功状态码，返回 data 或整个响应
          if (responseData.hasOwnProperty('code') && (responseData.code === 200 || responseData.code ===
            0)) {
            resolve(responseData.data || responseData)
            return
          }

          // 如果没有 code 字段，直接返回响应数据（假设这是 Spring Boot 直接返回的实体）
          resolve(responseData)
        } else {
          // 处理非200状态码
          let errorMessage = `请求失败: ${statusCode}`

          // 尝试从响应数据中获取错误信息
          if (responseData && responseData.message) {
            errorMessage = responseData.message
          } else if (responseData && responseData.error) {
            errorMessage = responseData.error
          }

          uni.showToast({
            title: errorMessage,
            icon: 'none'
          })
          reject(new Error(`HTTP ${statusCode}: ${errorMessage}`))
        }
      },
      fail: (err) => {
        if (loading) {
          uni.hideLoading()
        }

        uni.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// 封装常用的HTTP方法
const http = {
  get(url, params = {}, options = {}) {
    return request({
      url,
      method: 'GET',
      params,
      ...options
    })
  },

  post(url, data = {}, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  },

  put(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  },

  delete(url, params = {}, options = {}) {
    return request({
      url,
      method: 'DELETE',
      params,
      ...options
    })
  },

  upload(url, filePath, formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      uni.showLoading({
        title: '上传中...',
        mask: true
      })

      const token = getToken()
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      uni.uploadFile({
        url: `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`,
        filePath,
        name: 'file',
        formData,
        header: headers,
        success: (res) => {
          uni.hideLoading()

          try {
            const data = JSON.parse(res.data)
            if (data.code === 200 || data.code === 0) {
              resolve(data.data || data)
            } else {
              uni.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              })
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            uni.showToast({
              title: '上传失败',
              icon: 'none'
            })
            reject(new Error('上传失败'))
          }
        },
        fail: (err) => {
          uni.hideLoading()
          uni.showToast({
            title: '上传失败，请检查网络',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  }
}

// 导出默认对象
export default http