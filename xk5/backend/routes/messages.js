const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 所有消息路由都需要认证
router.use(authenticateToken);

// 获取消息列表
router.get('/', async (req, res, next) => {
  try {
    const { ticket_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let sql = `
      SELECT m.*, u.username as sender_name 
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
    `;
    let params = [userId, userId];

    if (ticket_id) {
      sql += ' AND m.ticket_id = ?';
      params.push(ticket_id);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [messages] = await db.query(sql, params);

    // 获取总数
    let countSql = `
      SELECT COUNT(*) as total 
      FROM messages 
      WHERE (sender_id = ? OR receiver_id = ?)
    `;
    let countParams = [userId, userId];
    if (ticket_id) {
      countSql += ' AND ticket_id = ?';
      countParams.push(ticket_id);
    }
    const [countResult] = await db.query(countSql, countParams);

    res.json({
      success: true,
      data: {
        messages,
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

// 获取会话列表
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // 查询当前用户的最近会话
    const [conversations] = await db.query(`
      SELECT 
        u.id, 
        u.username as name, 
        '/static/images/avatars/consultant1.jpg' as avatar, 
        u.role, 
        m.content as lastMessage, 
        m.created_at as lastTime,
        0 as unreadCount, 
        'offline' as status
      FROM users u
      JOIN (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          MAX(created_at) as max_time
        FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_user_id
      ) latest ON u.id = latest.other_user_id
      JOIN messages m ON (
        (m.sender_id = ? AND m.receiver_id = u.id) OR 
        (m.sender_id = u.id AND m.receiver_id = ?)
      ) AND m.created_at = latest.max_time
      ORDER BY latest.max_time DESC
    `, [userId, userId, userId, userId, userId]);

    // 如果数据库为空，返回空数组而不是模拟数据
    // 如果需要保留模拟数据作为演示，可以在这里判断 conversations.length === 0
    
    if (conversations.length === 0) {
      // 暂时保留模拟数据逻辑以防数据库为空时页面完全空白，
      // 实际生产环境应直接返回 []
      const mockConversations = [
        {
          id: 1,
          name: '心理咨询师',
          avatar: '/static/images/avatars/consultant1.jpg',
          role: 'consultant',
          lastMessage: '您好，请问最近感觉如何？',
          lastTime: Date.now(),
          unreadCount: 1,
          status: 'online'
        }
      ];
      return res.json({
        success: true,
        data: mockConversations
      });
    }

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个消息详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [messages] = await db.query(
      `SELECT m.*, u.username as sender_name 
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)`,
      [id, userId, userId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    res.json({
      success: true,
      data: messages[0]
    });
  } catch (error) {
    next(error);
  }
});

// 发送消息
router.post('/', async (req, res, next) => {
  try {
    const { receiver_id, ticket_id, content, message_type = 'text' } = req.body;
    const senderId = req.user.userId;

    if (!receiver_id || !content) {
      return res.status(400).json({
        success: false,
        message: '请提供接收者ID和消息内容'
      });
    }

    // 检查接收者是否存在
    const [receivers] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [receiver_id]
    );

    if (receivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '接收者不存在'
      });
    }

    // 如果关联工单，检查工单是否存在
    if (ticket_id) {
      const [tickets] = await db.query(
        'SELECT id FROM tickets WHERE id = ?',
        [ticket_id]
      );

      if (tickets.length === 0) {
        return res.status(404).json({
          success: false,
          message: '工单不存在'
        });
      }
    }

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, ticket_id, content, message_type, status) VALUES (?, ?, ?, ?, ?, ?)',
      [senderId, receiver_id, ticket_id || null, content, message_type, 'unread']
    );

    const [newMessage] = await db.query(
      `SELECT m.*, u.username as sender_name 
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '消息发送成功',
      data: newMessage[0]
    });
  } catch (error) {
    next(error);
  }
});

// 更新消息状态（如标记为已读）
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查消息是否存在且接收者是当前用户
    const [messages] = await db.query(
      'SELECT * FROM messages WHERE id = ? AND receiver_id = ?',
      [id, userId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限'
      });
    }

    await db.query(
      'UPDATE messages SET status = ?, read_at = NOW() WHERE id = ?',
      ['read', id]
    );

    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    next(error);
  }
});

// 删除消息
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查消息是否存在且发送者是当前用户
    const [messages] = await db.query(
      'SELECT * FROM messages WHERE id = ? AND sender_id = ?',
      [id, userId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限'
      });
    }

    await db.query('DELETE FROM messages WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '消息删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

