<script setup>
import { onMounted } from 'vue';
</script>

<template>
    <div class="home-container">

        <section class="hero">
            <div class="hero-content">
                <h1 class="glitch-text" data-text="RACETRIX">RACETRIX</h1>
                <p class="subtitle">
                    源自热爱，不止于快。<br>
                    <span class="sub-text">赛道日爱好者的 DIY 数据伴侣。</span>
                </p>
                <div class="tags">
                    <span>#TrackDay</span>
                    <span>#DIY</span>
                    <span>#Data</span>
                </div>
                <div class="cta-group">
                    <a href="https://github.com/your-username/racetrix" target="_blank" class="btn btn-primary">
                        <span class="icon">⚡</span> GitHub
                    </a>
                    <router-link to="/builder" class="btn btn-outline">
                        创建赛道
                    </router-link>
                </div>
            </div>
            <div class="track-lines"></div>
        </section>

        <section class="showcase">
            <h2 class="section-title">功能特性</h2>

            <div class="cards-grid">
                <div class="feature-card delay-1">
                    <div class="card-image-placeholder">
                        <span class="icon-big">🛠️</span>
                    </div>
                    <div class="card-info">
                        <h3>DIY 硬件记录</h3>
                        <p>基于 ESP32 与 Python。拒绝封闭生态，拥有完全属于自己的遥测数据。</p>
                    </div>
                </div>

                <div class="feature-card delay-2">
                    <div class="card-image-placeholder">
                        <span class="icon-big">⏱️</span>
                    </div>
                    <div class="card-info">
                        <h3>支持 RaceChrono</h3>
                        <p>硬件直连 RaceChrono APP。无缝对接主流分析生态，手机即座舱。</p>
                    </div>
                </div>

                <div class="feature-card delay-3">
                    <div class="card-image-placeholder">
                        <span class="icon-big">📈</span>
                    </div>
                    <div class="card-info">
                        <h3>数据复盘</h3>
                        <p>网页端轨迹回放与 G 值分析。看懂哪里慢了，让刷圈更有意义。</p>
                    </div>
                </div>

                <div class="feature-card delay-4">
                    <div class="card-image-placeholder">
                        <span class="icon-big">🌍</span>
                    </div>
                    <div class="card-info">
                        <h3>赛道社区</h3>
                        <p>社区共建的地图库。无论知名赛车场还是无名山路，皆可分享。</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="github-section">
            <div class="github-card">
                <h2>Created by Enthusiasts</h2>
                <p>我们是写代码的车手，也是开车的程序员。</p>
                <p class="sub-desc">Racetrix 是开源的业余项目。欢迎提交 PR，一起完善这个玩具。</p>
                <div class="code-block">
                    <code>git clone https://github.com/racetrix/core.git</code>
                </div>
            </div>
        </section>

    </div>
</template>

<style scoped>
/* --- 布局容器 --- */
.home-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

/* --- Hero Section --- */
.hero {
    height: 90vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
    background: radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 70%);
    overflow: hidden;
}

.hero-content {
    z-index: 2;
    text-align: center;
    animation: slideUp 0.8s ease-out forwards;
    padding: 0 24px;
    /* 增加左右间距 */
    width: 100%;
    /* 确保宽度正确 */
    box-sizing: border-box;
}

h1 {
    font-size: 5rem;
    margin: 0;
    letter-spacing: 6px;
    color: #fff;
    font-weight: 800;
    text-transform: uppercase;
    text-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
}

.subtitle {
    font-size: 1.5rem;
    color: #fff;
    margin: 20px 0 10px;
    line-height: 1.4;
    font-weight: 600;
}

.sub-text {
    font-size: 1rem;
    color: var(--text-muted);
    font-weight: normal;
}

.tags {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 40px;
    margin-top: 15px;
}

.tags span {
    color: var(--race-green);
    font-family: monospace;
    background: rgba(0, 255, 157, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.cta-group {
    display: flex;
    gap: 20px;
    justify-content: center;
}

.btn {
    padding: 12px 30px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.btn-primary {
    background-color: var(--race-green);
    color: #000;
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.btn-primary:hover {
    background-color: #fff;
    box-shadow: 0 0 25px rgba(0, 255, 157, 0.6);
    transform: translateY(-2px);
}

.btn-outline {
    border: 1px solid var(--race-green);
    color: var(--race-green);
    background: transparent;
}

.btn-outline:hover {
    background: rgba(0, 255, 157, 0.1);
    color: #fff;
}

.track-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255, 255, 255, 0.03) 50px, rgba(255, 255, 255, 0.03) 51px);
    z-index: 1;
    pointer-events: none;
}

/* --- Showcase Section --- */
.showcase {
    padding: 80px 24px;
    /* 上下80，左右24 (留出空隙) */
    width: 100%;
    max-width: 1200px;
    box-sizing: border-box;
    /* 关键：确保 padding 不会撑破 100% */
}

.section-title {
    text-align: center;
    color: #fff;
    font-size: 1.8rem;
    margin-bottom: 50px;
    position: relative;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.section-title::after {
    content: '';
    display: block;
    width: 40px;
    height: 3px;
    background: var(--race-green);
    margin: 10px auto 0;
}

.cards-grid {
    display: grid;
    /* 核心修复：强制列数，防止 3+1 情况 */
    /* 默认大屏显示 4 列 */
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
}

/* 屏幕变窄时，切换为 2x2 对称布局 */
@media (max-width: 1100px) {
    .cards-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 手机端 1 列 */
@media (max-width: 600px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
}

.feature-card {
    background: #161616;
    border: 1px solid #333;
    padding: 30px;
    border-radius: 8px;
    transition: transform 0.3s ease, border-color 0.3s ease;
    display: flex;
    flex-direction: column;
    opacity: 0;
    animation: slideUp 0.6s ease-out forwards;
}

.delay-1 {
    animation-delay: 0.1s;
}

.delay-2 {
    animation-delay: 0.2s;
}

.delay-3 {
    animation-delay: 0.3s;
}

.delay-4 {
    animation-delay: 0.4s;
}

.feature-card:hover {
    transform: translateY(-5px);
    border-color: var(--race-green);
}

.card-image-placeholder {
    width: 100%;
    height: 120px;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    border-radius: 4px;
    border: 1px dashed #333;
}

.icon-big {
    font-size: 2.5rem;
}

.card-info h3 {
    color: #fff;
    margin: 0 0 10px;
    font-size: 1.1rem;
    font-weight: bold;
}

.card-info p {
    color: #888;
    font-size: 0.9rem;
    line-height: 1.6;
}

/* --- GitHub Section --- */
.github-section {
    width: 100%;
    padding: 100px 24px;
    /* 左右增加 24px */
    background: linear-gradient(180deg, #0a0a0a 0%, #111 100%);
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    /* 关键 */
}
.github-card {
    text-align: center;
    max-width: 700px;
}

.github-card h2 {
    color: #fff;
    margin-bottom: 10px;
}

.github-card p {
    color: #aaa;
    margin-bottom: 5px;
}

.sub-desc {
    font-size: 0.9rem;
    color: #666 !important;
    margin-bottom: 30px;
}

.code-block {
    margin-top: 20px;
    background: #000;
    padding: 15px 30px;
    border-radius: 4px;
    border: 1px solid #333;
    color: var(--race-green);
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    display: inline-block;
    user-select: all;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 响应式调整 */
@media (max-width: 768px) {

    /* 字体缩小，避免换行太难看 */
    h1 {
        font-size: 2.5rem;
        letter-spacing: 4px;
    }

    .subtitle {
        font-size: 1.1rem;
        padding: 0 10px;
    }

    /* 修复按钮过长的问题 */
    .cta-group {
        flex-direction: row;
        /* 改回横向排列 */
        flex-wrap: wrap;
        /* 如果屏幕实在太小(如iPhone SE)，允许换行 */
        width: auto;
        /* 宽度随内容 */
        gap: 15px;
        /* 间距稍微缩小 */
    }

    .btn {
        width: auto;
        /* 关键：取消 100% 宽度，回归自然宽度 */
        padding: 10px 20px;
        /* 稍微减小内边距，更精致 */
        font-size: 0.85rem;
        /* 字体微调 */
        min-width: 120px;
        /* 保证最小点击区域 */
        display: flex;
        /* 保证图标文字居中 */
        justify-content: center;
        align-items: center;
    }
}
</style>