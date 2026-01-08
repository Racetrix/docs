<script setup>
import { ref } from 'vue'

// 直接导入 JSON，Vite 会自动解析为对象/数组
import hardwareData from '../data/hardware.json'

// 使用导入的数据
const hardwareProjects = ref(hardwareData)

// 难度颜色映射保持不变...
const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return '#00ff9d'
    if (diff === 'Medium') return '#f39c12'
    if (diff === 'Hard') return '#ff4757'
    return '#ccc'
}
</script>

<template>
    <div class="hardware-page">
        <div class="page-header">
            <h1>HARDWARE SUPPORT</h1>
            <p>开源硬件方案库。选择适合你的架构，开始构建属于你的记录器。</p>
        </div>

        <div class="projects-grid">
            <div v-for="item in hardwareProjects" :key="item.id" class="project-card">
                <div class="card-top">
                    <div class="title-group">
                        <div class="proj-name">{{ item.name }}</div>
                        <div class="proj-ver">{{ item.version }}</div>
                    </div>
                    <div class="difficulty-badge"
                        :style="{ borderColor: getDifficultyColor(item.difficulty), color: getDifficultyColor(item.difficulty) }">
                        {{ item.difficulty }}
                    </div>
                </div>

                <p class="desc">{{ item.description }}</p>

                <div class="specs-container">
                    <div class="spec-row core-row">
                        <div class="spec-label">CORE</div>
                        <div class="chip-tag">
                            <span class="chip-icon">🔲</span> {{ item.core.model }}
                        </div>
                    </div>

                    <div class="spec-section">
                        <div class="spec-label">GPS OPTIONS</div>
                        <div class="tags-wrap">
                            <span v-for="g in item.gpsOptions" :key="g" class="tech-tag">{{ g }}</span>
                        </div>
                    </div>

                    <div class="spec-section">
                        <div class="spec-label">IMU / GYRO</div>
                        <div class="tags-wrap">
                            <span v-for="i in item.imuOptions" :key="i" class="tech-tag">{{ i }}</span>
                        </div>
                    </div>

                    <div class="spec-section" v-if="item.others.length > 0">
                        <div class="spec-label">MODULES</div>
                        <div class="tags-wrap">
                            <span v-for="o in item.others" :key="o" class="tech-tag text-only">{{ o }}</span>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="author-block">
                        <span class="label">MAINTAINER</span>
                        <span class="name">@{{ item.author }}</span>
                    </div>
                    <a :href="item.github" target="_blank" class="btn-github">
                        <span class="icon">⚡</span> SOURCE CODE
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hardware-page {
    min-height: 100vh;
    background: #0a0a0a;
    padding-top: 80px;
    /* 避让 Navbar */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.page-header {
    text-align: center;
    margin-bottom: 50px;
    padding: 0 24px;
    /* 增加左右防贴边 */
    box-sizing: border-box;
}

.page-header h1 {
    color: #fff;
    font-size: 2.5rem;
    letter-spacing: 4px;
    margin-bottom: 10px;
    font-weight: 800;
}

.page-header p {
    color: #888;
    font-size: 1rem;
}

/* 网格布局 */
.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    /* 稍微调小最小宽度，适应小手机 */
    gap: 30px;
    width: 100%;
    max-width: 1200px;
    padding: 0 24px 60px;
    /* 左右留出 24px */
    box-sizing: border-box;
    /* 关键 */
}
/* 卡片样式 */
.project-card {
    background: #161616;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s, border-color 0.3s;
    position: relative;
    overflow: hidden;
}

.project-card:hover {
    transform: translateY(-5px);
    border-color: var(--race-green);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* 顶部 */
.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.proj-name {
    color: #fff;
    font-size: 1.2rem;
    font-weight: bold;
}

.proj-ver {
    color: var(--race-green);
    font-size: 0.8rem;
    font-family: monospace;
    margin-top: 4px;
}

.difficulty-badge {
    font-size: 0.7rem;
    border: 1px solid #fff;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    font-weight: bold;
}

.desc {
    color: #888;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 25px;
    min-height: 40px;
    /* 保持对齐 */
}

/* 参数区 */
.specs-container {
    background: #111;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 25px;
    border: 1px solid #222;
    flex: 1;
    /* 撑开高度，让 footer 对齐 */
}

.spec-section {
    margin-bottom: 15px;
}

.spec-section:last-child {
    margin-bottom: 0;
}

.spec-label {
    color: #555;
    font-size: 0.65rem;
    font-weight: bold;
    margin-bottom: 6px;
    letter-spacing: 1px;
}

/* Core 样式 */
.core-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #222;
    padding-bottom: 15px;
}

.core-row .spec-label {
    margin-bottom: 0;
}

.chip-tag {
    color: #fff;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.chip-icon {
    font-size: 1.2rem;
}

/* 标签样式 */
.tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tech-tag {
    background: #222;
    color: #ccc;
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 2px;
    border: 1px solid #333;
}

.tech-tag.text-only {
    background: transparent;
    border: none;
    padding: 4px 0;
    margin-right: 10px;
    color: #666;
}

/* 底部 */
.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #222;
}

.author-block {
    display: flex;
    flex-direction: column;
}

.author-block .label {
    font-size: 0.6rem;
    color: #555;
}

.author-block .name {
    font-size: 0.9rem;
    color: #fff;
    font-weight: bold;
}

.btn-github {
    background: var(--race-green);
    color: #000;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: 0.2s;
}

.btn-github:hover {
    background: #fff;
    box-shadow: 0 0 10px var(--race-green);
}

@media (max-width: 600px) {
        .projects-grid {
            grid-template-columns: 1fr;
            /* 强制单列 */
            padding: 0 20px 60px;
            /* 小屏幕左右留 20px 即可 */
        }
}
</style>