import { post } from './request'

/**
 * 用户登录
 */
export const login = (data) => {
  return post('/auth/login', data)
}

/**
 * 用户注册
 */
export const register = (data) => {
  return post('/auth/register', data)
}

/**
 * 忘记密码
 */
export const forgetPassword = (data) => {
  return post('/auth/forget-password', data)
}

/**
 * 修改密码
 */
export const changePassword = (data) => {
  return post('/auth/change-password', data)
}

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return get('/auth/user-info')
}
