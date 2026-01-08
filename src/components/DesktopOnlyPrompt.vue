<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)
const threshold = 1024 // 阈值：小于 1024px (平板竖屏或手机) 显示提示

const checkScreenSize = () => {
    isMobile.value = window.innerWidth < threshold
}

onMounted(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
    <div v-if="isMobile" class="desktop-prompt-overlay">
        <div class="content">
            <div class="icon">💻</div>
            <h2>请使用桌面端访问</h2>
            <p>
                <strong>赛道构建</strong> 与 <strong>数据分析</strong> 功能包含复杂的地图交互与图表可视化，
                为了保证您的体验与数据准确性，请在 PC 或 Mac 宽屏设备上打开。
            </p>
            <router-link to="/" class="btn-back">返回首页</router-link>
        </div>
    </div>
</template>

<style scoped>
.desktop-prompt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000;
    z-index: 9999;
    /* 确保盖住一切 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    box-sizing: border-box;
}

.content {
    text-align: center;
    max-width: 400px;
    background: #111;
    padding: 40px;
    border: 1px solid #333;
    border-radius: 8px;
    box-shadow: 0 0 50px rgba(0, 255, 157, 0.1);
}

.icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

h2 {
    color: #fff;
    margin: 0 0 15px;
    font-size: 1.5rem;
}

p {
    color: #888;
    line-height: 1.6;
    margin-bottom: 30px;
    font-size: 0.95rem;
}

.btn-back {
    display: inline-block;
    padding: 10px 25px;
    border: 1px solid var(--race-green);
    color: var(--race-green);
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    transition: 0.2s;
}

.btn-back:hover {
    background: var(--race-green);
    color: #000;
}
</style>