import { createApp } from 'vue'
import './style.css' // 如果你有默认样式
import App from './App.vue'
import router from './router' // 引入路由

createApp(App).use(router).mount('#app')