// 输入验证工具函数

// 验证邮箱格式
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证密码强度
const validatePassword = (password) => {
  // 至少8个字符，包含大小写字母和数字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// 验证用户名格式
const validateUsername = (username) => {
  // 3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// 验证注册数据
const validateRegisterData = (data) => {
  const errors = [];

  if (!data.username) {
    errors.push('用户名不能为空');
  } else if (!validateUsername(data.username)) {
    errors.push('用户名格式不正确（3-20个字符，只能包含字母、数字、下划线）');
  }

  if (!data.email) {
    errors.push('邮箱不能为空');
  } else if (!validateEmail(data.email)) {
    errors.push('邮箱格式不正确');
  }

  if (!data.password) {
    errors.push('密码不能为空');
  } else if (data.password.length < 8) {
    errors.push('密码长度至少8个字符');
  } else if (!validatePassword(data.password)) {
    errors.push('密码必须包含至少一个大写字母、一个小写字母和一个数字');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 验证登录数据
const validateLoginData = (data) => {
  const errors = [];

  if (!data.username) {
    errors.push('用户名或邮箱不能为空');
  }

  if (!data.password) {
    errors.push('密码不能为空');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRegisterData,
  validateLoginData
};

