import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

// 创建Vue实例
const app = createApp(App)

// 使用 Vuex
app.use(store)

// 配置全局属性（如果需要）
app.config.globalProperties.$uni = uni

// 挂载应用
app.mount('#app')