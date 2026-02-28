// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 默认错误信息
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';

  // MySQL错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = '数据已存在，不能重复创建';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = '关联数据不存在';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = '数据库连接失败';
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

