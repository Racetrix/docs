<script setup>
import { ref, computed, watch } from 'vue'
import faqData from '../data/faq.json'

const activeId = ref(null)
const searchQuery = ref("")
const activeCategory = ref("全部")

// 1. 自动提取所有唯一的分类，并加上 '全部'
const categories = computed(() => {
    const uniqueCats = [...new Set(faqData.map(item => item.category))]
    return ['全部', ...uniqueCats]
})

// 2. 核心过滤逻辑：先看搜索，再看分类
const filteredData = computed(() => {
    let data = faqData

    // 如果有搜索词，优先匹配搜索词（并在全部分类中搜索）
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        return data.filter(item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        )
    }

    // 如果没有搜索词，则按分类筛选
    if (activeCategory.value !== '全部') {
        data = data.filter(item => item.category === activeCategory.value)
    }

    return data
})

// 3. 监听搜索：一旦用户开始搜索，自动切回“全部”，防止用户在错误的分类下搜不到东西
watch(searchQuery, (newVal) => {
    if (newVal) activeCategory.value = '全部'
})

const toggleItem = (id) => {
    activeId.value = activeId.value === id ? null : id
}

const setCategory = (cat) => {
    activeCategory.value = cat
    searchQuery.value = "" // 切换分类时清空搜索
    activeId.value = null // 收起所有展开项
}
</script>

<template>
    <div class="faq-page">
        <div class="layout-container">

            <aside class="left-panel">
                <div class="sticky-wrapper">
                    <h1 class="page-title">HELP CENTER</h1>

                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" v-model="searchQuery" placeholder="搜索关键词..." class="search-input" />
                    </div>

                    <div class="category-nav">
                        <div class="nav-label">CATEGORIES</div>
                        <button v-for="cat in categories" :key="cat" class="cat-btn"
                            :class="{ 'active': activeCategory === cat }" @click="setCategory(cat)">
                            {{ cat }}
                            <span class="count" v-if="cat === '全部'">{{ faqData.length }}</span>
                            <span class="count" v-else>{{faqData.filter(i => i.category === cat).length}}</span>
                        </button>
                    </div>

                    <div class="contact-card">
                        <h3>硬件定制服务</h3>
                        <p>需要更高精度的 RTK 模块或整机定制？</p>
                        <a href="mailto:support@racetrix.com" class="btn-email">联系工程师</a>
                    </div>
                </div>
            </aside>

            <main class="right-panel">

                <div class="section-header">
                    <h2>{{ searchQuery ? '搜索结果' : activeCategory }}</h2>
                    <span class="result-count">{{ filteredData.length }} 个相关问题</span>
                </div>

                <div v-if="filteredData.length === 0" class="empty-result">
                    😕 没有找到相关内容，请尝试其他关键词。
                </div>

                <div class="faq-list">
                    <div v-for="item in filteredData" :key="item.id" class="faq-item"
                        :class="{ 'is-open': activeId === item.id }">
                        <div class="faq-head" @click="toggleItem(item.id)">
                            <div class="head-left">
                                <span class="cat-tag" v-if="activeCategory === '全部'">{{ item.category }}</span>
                                <span class="question">{{ item.question }}</span>
                            </div>
                            <span class="toggle-icon"></span>
                        </div>

                        <div class="faq-body">
                            <div class="body-inner">
                                <p class="answer">{{ item.answer }}</p>
                                <div v-if="item.image" class="img-box">
                                    <img :src="item.image" loading="lazy" alt="Solution Image" />
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
.faq-page {
    min-height: 100vh;
    background-color: #0a0a0a;
    padding-top: 100px;
    padding-bottom: 60px;
    box-sizing: border-box;
}

.layout-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: grid;
    grid-template-columns: 320px 1fr;
    /* 左侧宽度微调 */
    gap: 60px;
}

/* --- 左侧面板 --- */
.left-panel {
    position: relative;
}

.sticky-wrapper {
    position: sticky;
    top: 100px;
}

.page-title {
    font-size: 2.5rem;
    color: #fff;
    margin: 0 0 25px 0;
    letter-spacing: 1px;
    font-weight: 800;
}

/* 搜索框 */
.search-box {
    position: relative;
    margin-bottom: 30px;
}

.search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 0.9rem;
}

.search-input {
    width: 100%;
    background: #161616;
    border: 1px solid #333;
    padding: 12px 12px 12px 40px;
    color: #fff;
    border-radius: 4px;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.3s;
    box-sizing: border-box;
}

.search-input:focus {
    border-color: var(--race-green);
    box-shadow: 0 0 10px rgba(0, 255, 157, 0.1);
}

/* [新增] 分类导航 */
.category-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 40px;
}

.nav-label {
    color: #555;
    font-size: 0.7rem;
    font-weight: bold;
    margin-bottom: 5px;
    letter-spacing: 1px;
}

.cat-btn {
    background: transparent;
    border: none;
    text-align: left;
    color: #888;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
    font-size: 0.95rem;
}

.cat-btn:hover {
    background: #1a1a1a;
    color: #fff;
}

.cat-btn.active {
    background: #1a1a1a;
    color: var(--race-green);
    font-weight: bold;
    border-left: 3px solid var(--race-green);
}

.count {
    background: #222;
    color: #666;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
}

.cat-btn.active .count {
    background: var(--race-green);
    color: #000;
}

/* 联系卡片 */
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
    line-height: 1.4;
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
    transition: 0.2s;
}

.btn-email:hover {
    background: var(--race-green);
    color: #000;
}

/* --- 右侧面板 --- */
.right-panel {
    min-height: 50vh;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
    border-bottom: 1px solid #222;
    padding-bottom: 10px;
}

.section-header h2 {
    color: #fff;
    margin: 0;
    font-size: 1.5rem;
}

.result-count {
    color: #666;
    font-size: 0.9rem;
}

.empty-result {
    color: #666;
    padding-top: 20px;
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
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.3s;
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
    transition: background 0.2s;
}

.faq-head:hover {
    background: #222;
}

.head-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.cat-tag {
    font-size: 0.7rem;
    background: #333;
    color: #aaa;
    padding: 2px 6px;
    border-radius: 2px;
    white-space: nowrap;
}

.question {
    color: #eee;
    font-weight: bold;
    font-size: 1rem;
    line-height: 1.4;
}

.toggle-icon {
    width: 12px;
    height: 12px;
    position: relative;
    flex-shrink: 0;
    margin-left: 15px;
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
    transform: translate(-50%, -50%) rotate(90deg);
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
    max-height: 1000px;
}

.body-inner {
    padding: 20px;
    border-top: 1px solid #222;
}

.answer {
    color: #ccc;
    line-height: 1.7;
    white-space: pre-line;
    margin: 0;
}

.img-box {
    margin-top: 15px;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
}

.img-box img {
    width: 100%;
    display: block;
}

/* --- 移动端适配 --- */
@media (max-width: 900px) {
    .layout-container {
        grid-template-columns: 1fr;
        gap: 30px;
    }

    .sticky-wrapper {
        position: static;
    }

    .category-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }

    .cat-btn {
        white-space: nowrap;
        border: 1px solid #333;
        flex-shrink: 0;
    }

    .cat-btn.active {
        border-left: 1px solid #333;
        border-color: var(--race-green);
        background: rgba(0, 255, 157, 0.1);
    }

    .contact-card {
        display: none;
    }

    .section-header {
        margin-top: 10px;
    }
}
</style>