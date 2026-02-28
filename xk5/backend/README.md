# Express 后端项目

这是一个基于 Node.js + Express 的后端项目，包含用户认证、工单管理、消息系统等功能。

## 功能特性

- ✅ Express 服务器配置
- ✅ MySQL 数据库连接
- ✅ JWT 身份验证
- ✅ 用户注册/登录
- ✅ 工单管理（CRUD）
- ✅ 消息系统
- ✅ 用户管理
- ✅ 错误处理中间件
- ✅ CORS 支持

## 项目结构

```
backend/
├── config/
│   └── database.js          # 数据库连接配置
├── middleware/
│   ├── auth.js              # JWT 认证中间件
│   └── errorHandler.js      # 错误处理中间件
├── routes/
│   ├── auth.js              # 认证路由（登录/注册）
│   ├── tickets.js           # 工单路由
│   ├── messages.js          # 消息路由
│   └── users.js             # 用户路由
├── server.js                # 服务器入口文件
├── package.json             # 项目依赖
├── .env.example             # 环境变量示例
└── README.md                # 项目说明
```

## 安装步骤

1. **安装依赖**
```bash
cd backend
npm install
```

2. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的数据库配置和 JWT 密钥：
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=your_database_name
```

3. **创建数据库表**

执行以下 SQL 语句创建必要的表：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 工单表
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  ticket_id INT,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  status VARCHAR(20) DEFAULT 'unread',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);
```

4. **启动服务器**

开发模式（使用 nodemon）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 接口文档

### 认证接口 (`/api/auth`)

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）
- `POST /api/auth/refresh` - 刷新令牌（需要认证）

### 工单接口 (`/api/tickets`)

所有工单接口都需要 JWT 认证。

- `GET /api/tickets` - 获取工单列表（支持分页和状态筛选）
- `GET /api/tickets/:id` - 获取单个工单详情
- `POST /api/tickets` - 创建工单
- `PUT /api/tickets/:id` - 更新工单
- `DELETE /api/tickets/:id` - 删除工单

### 消息接口 (`/api/messages`)

所有消息接口都需要 JWT 认证。

- `GET /api/messages` - 获取消息列表（支持分页和工单筛选）
- `GET /api/messages/:id` - 获取单个消息详情
- `POST /api/messages` - 发送消息
- `PATCH /api/messages/:id/read` - 标记消息为已读
- `DELETE /api/messages/:id` - 删除消息

### 用户接口 (`/api/users`)

所有用户接口都需要 JWT 认证。

- `GET /api/users` - 获取用户列表（仅管理员）
- `GET /api/users/:id` - 获取单个用户信息
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户（仅管理员）

## 使用示例

### 1. 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. 创建工单（需要认证）
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "测试工单",
    "description": "这是一个测试工单",
    "priority": "high",
    "category": "技术问题"
  }'
```

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **MySQL2** - MySQL 数据库驱动
- **JWT** - 身份验证
- **bcryptjs** - 密码加密
- **CORS** - 跨域支持
- **dotenv** - 环境变量管理

## 注意事项

1. 生产环境请务必修改 `.env` 中的 `JWT_SECRET`
2. 确保数据库连接配置正确
3. 建议使用连接池管理数据库连接
4. 生产环境应启用 HTTPS
5. 建议添加请求限流和日志记录

## 许可证

ISC

