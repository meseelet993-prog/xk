// config/config.js
const config = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:8082/api',
    wsBase: 'ws://localhost:8082'
  },
  // 生产环境
  production: {
    baseURL: 'https://your-prod-api.com/api'
  }
}

// 根据环境变量选择配置
const env = process.env.NODE_ENV || 'development'
export default config[env]
