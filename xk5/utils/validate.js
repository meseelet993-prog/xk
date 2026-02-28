/**
 * 手机号验证
 */
export const validatePhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 邮箱验证
 */
export const validateEmail = (email) => {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}

/**
 * 密码强度验证
 */
export const validatePassword = (password) => {
  // 至少8位，包含字母和数字
  const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  return reg.test(password)
}

/**
 * 用户名验证
 */
export const validateUsername = (username) => {
  // 3-20位，字母数字下划线
  const reg = /^[a-zA-Z0-9_]{3,20}$/
  return reg.test(username)
}