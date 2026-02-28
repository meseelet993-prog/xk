// utils/request.js
import config from '@/config/config.js'

class Request {
  constructor() {
    this.baseURL = config.baseURL
    this.timeout = 10000
  }

  request(options) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        timeout: this.timeout,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  get(url, data = {}) {
    return this.request({
      url,
      method: 'GET',
      data
    })
  }

  post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    })
  }

  put(url, data = {}) {
    return this.request({
      url,
      method: 'PUT',
      data
    })
  }

  delete(url, data = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data
    })
  }
}

export default new Request()