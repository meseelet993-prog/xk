const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 所有工单路由都需要认证
router.use(authenticateToken);

// 获取工单列表
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let sql = 'SELECT * FROM tickets WHERE user_id = ?';
    let params = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tickets] = await db.query(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM tickets WHERE user_id = ?';
    let countParams = [userId];
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await db.query(countSql, countParams);

    res.json({
      success: true,
      data: {
        tickets,
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

// 获取单个工单详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [tickets] = await db.query(
      'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }

    res.json({
      success: true,
      data: tickets[0]
    });
  } catch (error) {
    next(error);
  }
});

// 创建工单
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority = 'medium', category } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: '请提供工单标题和描述'
      });
    }

    const [result] = await db.query(
      'INSERT INTO tickets (user_id, title, description, priority, category, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, description, priority, category || null, 'open']
    );

    const [newTicket] = await db.query(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '工单创建成功',
      data: newTicket[0]
    });
  } catch (error) {
    next(error);
  }
});

// 更新工单
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, status, priority, category } = req.body;

    // 检查工单是否存在且属于当前用户
    const [existingTickets] = await db.query(
      'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingTickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工单不存在或无权限'
      });
    }

    // 构建更新字段
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
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
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedTicket] = await db.query(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '工单更新成功',
      data: updatedTicket[0]
    });
  } catch (error) {
    next(error);
  }
});

// 删除工单
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查工单是否存在且属于当前用户
    const [existingTickets] = await db.query(
      'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingTickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工单不存在或无权限'
      });
    }

    await db.query('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '工单删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

