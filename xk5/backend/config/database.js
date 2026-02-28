const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('数据库连接池创建成功');
    connection.release();
  })
  .catch(error => {
    console.error('数据库连接失败:', error);
  });

// 执行查询的辅助函数
// 返回 [results, fields] 格式，与 mysql2 的 execute 方法一致
const query = async (sql, params) => {
  try {
    return await pool.execute(sql, params);
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getConnection: () => pool.getConnection(),
  end: () => pool.end()
};

