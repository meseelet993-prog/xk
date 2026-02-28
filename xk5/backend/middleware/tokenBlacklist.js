// Token黑名单管理（用于logout功能）
// 注意：这是内存存储，服务器重启后会清空。生产环境建议使用Redis

const blacklistedTokens = new Set();

// 将token加入黑名单
const addToBlacklist = (token) => {
  blacklistedTokens.add(token);
};

// 检查token是否在黑名单中
const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

// 从黑名单中移除token（可选，用于token过期后清理）
const removeFromBlacklist = (token) => {
  blacklistedTokens.delete(token);
};

// 定期清理过期的token（可选优化）
// 由于JWT有过期时间，可以定期清理，但这里简化处理

module.exports = {
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist
};

