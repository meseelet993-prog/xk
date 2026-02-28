const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRegisterData, validateLoginData } = require('../utils/validators');
const { addToBlacklist } = require('../middleware/tokenBlacklist');

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入数据
    const validation = validateRegisterData({ username, email, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: validation.errors
      });
    }

    // 检查用户是否已存在
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 加密密码（使用bcrypt）
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: result.insertId, username, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 查询新创建的用户信息（不包含密码）
    const [newUsers] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: newUsers[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 验证输入数据
    const validation = validateLoginData({ username, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: validation.errors
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    const [users] = await db.query(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 验证密码（使用bcrypt比较）
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 查询完整的用户信息（不包含密码）
    const [userInfo] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [user.id]
    );

    // 返回用户信息和token
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息（需要认证）
// 支持 /me 和 /profile 两个路由
const getProfileHandler = async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

router.get('/me', authenticateToken, getProfileHandler);
router.get('/profile', authenticateToken, getProfileHandler);

// 用户退出登录
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const token = req.token;

    if (token) {
      // 将token加入黑名单
      addToBlacklist(token);
    }

    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    next(error);
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const oldToken = req.token;

    // 生成新令牌
    const newToken = jwt.sign(
      { userId: req.user.userId, username: req.user.username, email: req.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 将旧令牌加入黑名单（可选，如果需要使旧令牌立即失效）
    if (oldToken) {
      addToBlacklist(oldToken);
    }

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token: newToken }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

