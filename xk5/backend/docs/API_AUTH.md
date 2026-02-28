# 用户认证 API 接口文档

## 概述

所有认证相关的 API 接口都位于 `/api/auth` 路径下。

## 接口列表

### 1. 用户注册

**POST** `/api/auth/register`

注册新用户账户。

**请求体：**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

**请求参数说明：**
- `username` (string, 必需): 用户名，3-20个字符，只能包含字母、数字、下划线
- `email` (string, 必需): 邮箱地址，必须符合邮箱格式
- `password` (string, 必需): 密码，至少8个字符，必须包含至少一个大写字母、一个小写字母和一个数字

**成功响应 (201)：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应：**
- `400`: 输入数据验证失败
- `409`: 用户名或邮箱已存在

---

### 2. 用户登录

**POST** `/api/auth/login`

用户登录，获取访问令牌。

**请求体：**
```json
{
  "username": "testuser",
  "password": "Password123"
}
```

**请求参数说明：**
- `username` (string, 必需): 用户名或邮箱地址
- `password` (string, 必需): 密码

**成功响应 (200)：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应：**
- `400`: 输入数据验证失败
- `401`: 用户名或密码错误

---

### 3. 用户退出登录

**POST** `/api/auth/logout`

用户退出登录，将当前 token 加入黑名单。

**请求头：**
```
Authorization: Bearer {token}
```

**成功响应 (200)：**
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

**错误响应：**
- `401`: 未提供访问令牌或令牌无效

**说明：**
- 此接口需要 JWT 认证
- 退出后，当前 token 将被加入黑名单，无法再使用
- 客户端应在调用此接口后删除本地存储的 token

---

### 4. 获取用户信息

**GET** `/api/auth/profile`

获取当前登录用户的详细信息。

**请求头：**
```
Authorization: Bearer {token}
```

**成功响应 (200)：**
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应：**
- `401`: 未提供访问令牌或令牌无效
- `404`: 用户不存在

**说明：**
- 此接口需要 JWT 认证
- 同时支持 `/api/auth/me` 路由（功能相同）

---

## 认证方式

所有需要认证的接口都需要在请求头中携带 JWT token：

```
Authorization: Bearer {your_jwt_token}
```

## 密码要求

- 至少 8 个字符
- 必须包含至少一个大写字母
- 必须包含至少一个小写字母
- 必须包含至少一个数字

## 使用示例

### cURL 示例

**注册：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
  }'
```

**登录：**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123"
  }'
```

**获取用户信息：**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**退出登录：**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript (Fetch) 示例

**登录：**
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'Password123'
  })
});

const data = await response.json();
if (data.success) {
  const token = data.data.token;
  localStorage.setItem('token', token);
}
```

**获取用户信息：**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data);
```

**退出登录：**
```javascript
const token = localStorage.getItem('token');
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
localStorage.removeItem('token');
```

## 安全说明

1. **密码加密**：所有密码使用 bcrypt 进行加密存储，salt rounds 为 10
2. **JWT Token**：使用 JWT 进行身份验证，token 默认有效期为 24 小时
3. **Token 黑名单**：退出登录后，token 会被加入黑名单，防止被继续使用
4. **输入验证**：所有用户输入都经过严格验证
5. **错误处理**：统一的错误处理，不泄露敏感信息

## 注意事项

1. 生产环境请务必修改 `.env` 文件中的 `JWT_SECRET`
2. Token 黑名单目前使用内存存储，服务器重启后会清空。生产环境建议使用 Redis
3. 建议使用 HTTPS 协议传输敏感信息
4. Token 应存储在安全的地方（如 httpOnly cookie 或安全的本地存储）

