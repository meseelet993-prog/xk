// 在浏览器控制台测试
fetch('http://localhost:8082/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpass',
      confirmPassword: 'testpass',
      phone: '13800138000',
      email: 'test@example.com',
      realName: '测试用户',
      role: 'STUDENT'
    })
  })
  .then(response => {
    console.log('状态码:', response.status)
    console.log('状态文本:', response.statusText)
    return response.text()
  })
  .then(data => console.log('响应数据:', data))
  .catch(error => console.error('错误:', error))