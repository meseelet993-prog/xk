'use strict';
exports.main = async (event, context) => {
  // event 里包含着客户端（你的前端页面）传过来的参数
  const {
    username,
    password
  } = event;

  // 1. 获取数据库引用
  const db = uniCloud.database();
  // 2. 获取 `users` 集合的引用
  const usersCollection = db.collection('users');

  try {
    // 3. 在数据库中查询匹配的用户
    const res = await usersCollection.where({
      username: username,
      password: password // 注意：真实项目中密码需要加密存储（如 md5），这里为了简化示例
    }).get();

    // 4. 判断查询结果
    if (res.data.length > 0) {
      // 登录成功
      return {
        code: 200,
        message: '登录成功',
        data: {
          uid: res.data[0]._id,
          username: res.data[0].username,
          role: res.data[0].role // 返回用户角色，如 'student', 'counselor'
        }
      };
    } else {
      // 登录失败
      return {
        code: 401,
        message: '用户名或密码错误'
      };
    }
  } catch (err) {
    // 服务器错误
    return {
      code: 500,
      message: '服务器内部错误，请稍后再试'
    };
  }
};