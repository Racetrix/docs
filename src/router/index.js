import { createRouter, createWebHistory } from 'vue-router'

// 引入页面组件
import HomeView from '../views/HomeView.vue'
import AnalysisView from '../views/AnalysisView.vue'
import ShareView from '../views/ShareView.vue'
import SynthesisView from '../views/SynthesisView.vue'
import HardwareView from '../views/HardwareView.vue'
import FAQView from '../views/FAQView.vue' // [新增]
const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        meta: { title: 'Racetrix - 首页' }
    },
    {
        path: '/builder', // [修改] 原合成页改名为 builder
        name: 'Builder',
        component: SynthesisView,
        meta: { title: '赛道构建器' }
    },
    {
        path: '/analysis', // [新增] 多车分析页
        name: 'Analysis',
        component: AnalysisView,
        meta: { title: '多车数据分析' }
    },
    {
        path: '/share',
        name: 'Share',
        component: ShareView,
        meta: { title: '赛道分享' }
    },
    {
        path: '/hardware',
        name: 'Hardware',
        component: HardwareView,
        meta: { title: '硬件支持列表' }
    },
    {
        path: '/faq',
        name: 'FAQ',
        component: FAQView,
        meta: { title: '常见问题' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router