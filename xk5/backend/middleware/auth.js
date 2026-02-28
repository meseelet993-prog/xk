const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('./tokenBlacklist');

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供访问令牌'
    });
  }

  // 检查token是否在黑名单中（已注销）
  if (isBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: '令牌已失效，请重新登录'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }

    req.user = user; // 将用户信息附加到请求对象
    req.token = token; // 将token也附加到请求对象，用于logout
    next();
  });
};

// 可选：角色验证中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};

