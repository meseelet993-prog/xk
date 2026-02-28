const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 所有用户路由都需要认证
router.use(authenticateToken);

// 获取用户列表（管理员权限）
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, username, email, created_at FROM users WHERE 1=1';
    let params = [];

    if (search) {
      sql += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await db.query(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];
    if (search) {
      countSql += ' AND (username LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countResult] = await db.query(countSql, countParams);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个用户信息
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 只能查看自己的信息，除非是管理员
    if (parseInt(id) !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const [users] = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
});

// 更新用户信息
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { username, email, password } = req.body;

    // 只能更新自己的信息，除非是管理员
    if (parseInt(id) !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改'
      });
    }

    // 检查用户是否存在
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 构建更新字段
    const updates = [];
    const values = [];

    if (username !== undefined) {
      // 检查用户名是否已被使用
      const [duplicateUsers] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      if (duplicateUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: '用户名已被使用'
        });
      }
      updates.push('username = ?');
      values.push(username);
    }

    if (email !== undefined) {
      // 检查邮箱是否已被使用
      const [duplicateUsers] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (duplicateUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedUser] = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
});

// 删除用户（管理员权限）
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

