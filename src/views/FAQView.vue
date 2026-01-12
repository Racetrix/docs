<script setup>
import { ref, computed, watch } from 'vue'
import faqData from '../data/faq.json'

const activeId = ref(null)
const searchQuery = ref("")
const activeCategory = ref("全部")

// 自动提取分类
const categories = computed(() => {
    const uniqueCats = [...new Set(faqData.map(item => item.category))]
    return ['全部', ...uniqueCats]
})

// 筛选逻辑
const filteredData = computed(() => {
    let data = faqData
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        return data.filter(item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        )
    }
    if (activeCategory.value !== '全部') {
        data = data.filter(item => item.category === activeCategory.value)
    }
    return data
})

watch(searchQuery, (newVal) => {
    if (newVal) activeCategory.value = '全部'
})

const toggleItem = (id) => {
    activeId.value = activeId.value === id ? null : id
}

const setCategory = (cat) => {
    activeCategory.value = cat
    searchQuery.value = ""
    activeId.value = null

    if (window.innerWidth < 768) {
        const listEl = document.querySelector('.right-panel')
        if (listEl) {
            const top = listEl.getBoundingClientRect().top + window.scrollY - 80
            window.scrollTo({ top, behavior: 'smooth' })
        }
    }
}
</script>

<template>
    <div class="faq-page">
        <div class="layout-container">

            <aside class="left-panel">
                <div class="sticky-wrapper">
                    <div class="header-group">
                        <h1 class="page-title">HELP CENTER</h1>
                        <p class="page-desc desktop-only">
                            硬件连接、APP设置及数据导出的常见问题解答。
                        </p>
                    </div>

                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" v-model="searchQuery" placeholder="搜索问题..." class="search-input" />
                    </div>

                    <div class="category-wrapper">
                        <div class="category-nav">
                            <button v-for="cat in categories" :key="cat" class="cat-btn"
                                :class="{ 'active': activeCategory === cat }" @click="setCategory(cat)">
                                {{ cat }}
                            </button>
                        </div>
                    </div>

                    <div class="contact-card desktop-only">
                        <h3>定制服务</h3>
                        <p>需要 RTK 模块或整机定制？</p>
                        <a href="mailto:support@racetrix.com" class="btn-email">联系工程师</a>
                    </div>
                </div>
            </aside>

            <main class="right-panel">
                <div class="section-header">
                    <h2>{{ searchQuery ? '搜索结果' : activeCategory }}</h2>
                    <span class="result-count">{{ filteredData.length }} 个问题</span>
                </div>

                <div v-if="filteredData.length === 0" class="empty-result">
                    未找到相关内容
                </div>

                <div class="faq-list">
                    <div v-for="item in filteredData" :key="item.id" class="faq-item"
                        :class="{ 'is-open': activeId === item.id }">
                        <div class="faq-head" @click="toggleItem(item.id)">
                            <div class="head-content">
                                <span class="cat-tag" v-if="activeCategory === '全部'">{{ item.category }}</span>
                                <span class="question">{{ item.question }}</span>
                            </div>
                            <span class="toggle-icon"></span>
                        </div>

                        <div class="faq-body">
                            <div class="body-inner">
                                <p class="answer">{{ item.answer }}</p>
                                <div v-if="item.image" class="img-box">
                                    <img :src="item.image" loading="lazy" alt="Solution" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    </div>
</template>

<style scoped>
/* 1. 全局重置，防止 padding 撑大 */
* {
    box-sizing: border-box;
}

.faq-page {
    min-height: 100vh;
    background-color: #0a0a0a;
    padding-top: 100px;
    padding-bottom: 60px;
    width: 100%;
    overflow-x: hidden;
    /* 兜底：强制隐藏横向滚动条 */
}

/* 2. 桌面端 Grid 布局 */
.layout-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 60px;
    width: 100%;
}

/* --- 左侧样式 --- */
.left-panel {
    position: relative;
    z-index: 10;
    min-width: 0;
}

.sticky-wrapper {
    position: sticky;
    top: 100px;
}

.page-title {
    font-size: 2.5rem;
    color: #fff;
    margin: 0 0 10px 0;
    font-weight: 800;
    line-height: 1.1;
}

.page-desc {
    color: #888;
    margin-bottom: 30px;
    font-size: 0.9rem;
}

.search-box {
    position: relative;
    margin-bottom: 30px;
    width: 100%;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 1rem;
}

.search-input {
    width: 100%;
    background: #161616;
    border: 1px solid #333;
    padding: 12px 12px 12px 40px;
    color: #fff;
    border-radius: 6px;
    outline: none;
    transition: all 0.3s;
    min-width: 0;
    /* 防止 Flex/Grid 中 input 撑开 */
}

.search-input:focus {
    border-color: var(--race-green);
    background: #000;
}

.category-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 40px;
}

.cat-btn {
    background: transparent;
    border: 1px solid transparent;
    text-align: left;
    color: #888;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
}

.cat-btn:hover {
    background: #1a1a1a;
    color: #fff;
}

.cat-btn.active {
    background: rgba(0, 255, 157, 0.1);
    color: var(--race-green);
    border-color: var(--race-green);
    font-weight: bold;
}

.contact-card {
    background: #111;
    border: 1px dashed #333;
    padding: 20px;
    border-radius: 6px;
}

.contact-card h3 {
    color: #fff;
    font-size: 0.95rem;
    margin: 0 0 8px 0;
}

.contact-card p {
    color: #666;
    font-size: 0.8rem;
    margin-bottom: 15px;
}

.btn-email {
    display: inline-block;
    color: var(--race-green);
    border: 1px solid var(--race-green);
    padding: 5px 15px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: bold;
}

/* --- 右侧样式 --- */
.right-panel {
    min-height: 50vh;
    min-width: 0;
    /* 关键：防止 Grid 子元素被宽图片撑开 */
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
    border-bottom: 1px solid #222;
    padding-bottom: 10px;
    flex-wrap: wrap;
    gap: 10px;
}

.section-header h2 {
    color: #fff;
    margin: 0;
    font-size: 1.5rem;
}

.result-count {
    color: #666;
    font-size: 0.85rem;
}

.empty-result {
    color: #666;
    padding: 20px 0;
    text-align: center;
}

.faq-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.faq-item {
    background: #161616;
    border: 1px solid #333;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.3s;
    width: 100%;
}

.faq-item.is-open {
    border-color: var(--race-green);
}

.faq-head {
    padding: 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1a1a1a;
}

.head-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 10px;
    min-width: 0;
    flex: 1;
}

.cat-tag {
    font-size: 0.7rem;
    color: var(--race-green);
    font-weight: bold;
    text-transform: uppercase;
}

.question {
    color: #eee;
    font-weight: bold;
    font-size: 1rem;
    line-height: 1.4;
    word-wrap: break-word;
}

.toggle-icon {
    width: 12px;
    height: 12px;
    position: relative;
    flex-shrink: 0;
    margin-left: 10px;
}

.toggle-icon::before,
.toggle-icon::after {
    content: '';
    position: absolute;
    background: #666;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s;
}

.toggle-icon::before {
    width: 100%;
    height: 2px;
}

.toggle-icon::after {
    width: 2px;
    height: 100%;
}

.faq-item.is-open .toggle-icon::after {
    transform: rotate(90deg);
    opacity: 0;
}

.faq-item.is-open .toggle-icon::before {
    background: var(--race-green);
}

.faq-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-in-out;
    background: #111;
}

.faq-item.is-open .faq-body {
    max-height: 3000px;
}

.body-inner {
    padding: 20px;
    border-top: 1px solid #222;
}

/* 3. 强制内容换行 */
.answer {
    color: #ccc;
    line-height: 1.7;
    white-space: pre-line;
    margin: 0;
    font-size: 0.95rem;
    word-break: break-word;
    overflow-wrap: anywhere;
    /* 强制长网址换行 */
    max-width: 100%;
}

/* 4. 图片完全自适应 */
.img-box {
    margin-top: 15px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #333;
    width: 100%;
    max-width: 100%;
}

.img-box img {
    width: 100%;
    height: auto;
    display: block;
}


/* --- 📱 移动端适配 (900px以下) --- */
@media (max-width: 900px) {
    .faq-page {
        padding-top: 80px;
    }

    /* 5. 关键修改：取消 Grid，改用 Block 布局 */
    /* Grid 在移动端容易因为 min-content 撑开宽度，Block 更安全 */
    .layout-container {
        display: block;
        padding: 0 20px;
    }

    /* 头部区域 */
    .left-panel {
        margin-bottom: 20px;
        border-bottom: 1px solid #222;
        padding-bottom: 10px;
        width: 100%;
    }

    .sticky-wrapper {
        position: static;
    }

    .page-title {
        font-size: 1.8rem;
        text-align: left;
    }

    .desktop-only {
        display: none;
    }

    .search-box {
        margin-bottom: 15px;
    }

    /* 分类导航容器：处理滚动 */
    .category-wrapper {
        width: 100%;
        overflow: hidden;
        /* 防止父容器撑开 */
    }

    .category-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 5px;
        margin-bottom: 5px;
        gap: 10px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        /* Firefox */
        width: 100%;
    }

    .category-nav::-webkit-scrollbar {
        display: none;
    }

    /* Chrome/Safari */

    .cat-btn {
        white-space: nowrap;
        flex-shrink: 0;
        border: 1px solid #333;
        padding: 6px 14px;
        background: #111;
        font-size: 0.85rem;
    }

    .cat-btn.active {
        background: var(--race-green);
        color: #000;
    }

    /* 列表调整 */
    .right-panel {
        width: 100%;
    }

    .section-header h2 {
        font-size: 1.2rem;
    }

    .faq-head {
        padding: 15px;
    }

    .question {
        font-size: 0.95rem;
    }
}
</style>