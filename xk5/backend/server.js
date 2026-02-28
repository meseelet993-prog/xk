require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const setupWebSocket = require('./websocket');

// 导入路由
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const PORT = 8082;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// 聊天历史记录接口
app.get('/api/chat/history', async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;
    if (!userId1 || !userId2) {
      console.log('Missing parameters:', req.query);
      return res.status(400).json({
        success: false,
        message: `userId parameter is required (received: userId1=${userId1}, userId2=${userId2})`
      });
    }

    // 查询真实数据库历史记录
    const [messages] = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?) 
       ORDER BY created_at ASC`,
      [userId1, userId2, userId2, userId1]
    );

    res.json({
      success: true,
      data: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_id,
        type: msg.type || 'text',
        time: new Date(msg.created_at).getTime(),
        status: msg.status || 'read'
      }))
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: '路由不存在' 
  });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    try {
      await db.getConnection();
      console.log('数据库连接成功');
    } catch (dbError) {
      console.error('数据库连接失败，但服务器将继续启动以提供部分服务:', dbError.message);
    }
    
    // 初始化WebSocket
    setupWebSocket(server);

    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  await db.end();
  process.exit(0);
});

module.exports = app;

