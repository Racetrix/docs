<script setup>
import { ref, computed, watch } from 'vue'
// 导入两个数据文件
import rawLocationData from '../data/locations.json'
import rawTrackData from '../data/tracks.json'

// 绑定数据
const locationData = rawLocationData
const mockTracks = rawTrackData

// --- 状态变量 ---
const selectedProvince = ref("全部")
const selectedCity = ref("")
const searchQuery = ref("")

// --- 计算属性：城市列表 ---
const availableCities = computed(() => {
    if (selectedProvince.value === "全部") return []
    return locationData[selectedProvince.value] || []
})

// ... watch 和 filteredTracks 的逻辑完全保持不变 ...
watch(selectedProvince, () => {
    selectedCity.value = ""
})

const filteredTracks = computed(() => {
    return mockTracks.filter(track => {
        const matchProv = selectedProvince.value === "全部" || track.province === selectedProvince.value
        const matchCity = selectedCity.value === "" || track.city === selectedCity.value
        const matchQuery = track.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            track.author.toLowerCase().includes(searchQuery.value.toLowerCase())
        return matchProv && matchCity && matchQuery
    })
})
</script>

<template>
    <div class="share-page">
        <div class="filter-hud">
            <div class="hud-container">
                <div class="filter-group">
                    <label>PROVINCE / 省份</label>
                    <select v-model="selectedProvince" class="tech-select">
                        <option v-for="(cities, prov) in locationData" :key="prov" :value="prov">
                            {{ prov }}
                        </option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>CITY / 城市</label>
                    <select v-model="selectedCity" class="tech-select" :disabled="selectedProvince === '全部'">
                        <option value="">全部城市</option>
                        <option v-for="city in availableCities" :key="city" :value="city">
                            {{ city }}
                        </option>
                    </select>
                </div>

                <div class="filter-group search-group">
                    <label>SEARCH / 搜索</label>
                    <div class="input-wrapper">
                        <input type="text" v-model="searchQuery" placeholder="赛道名称 / 作者..." class="tech-input">
                        <span class="icon">🔍</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="track-grid-container">
            <div class="grid-header">
                <h3>发现赛道 <span class="count">({{ filteredTracks.length }})</span></h3>
                <div class="sort-opts">
                    <span>最新</span>
                    <span class="active">最热</span>
                </div>
            </div>

            <div class="grid">
                <div v-for="track in filteredTracks" :key="track.id" class="track-card">
                    <div class="card-thumb">
                        <img :src="track.image" :alt="track.name">
                        <div class="thumb-overlay">
                            <button class="btn-download">下载数据</button>
                        </div>
                        <div class="loc-tag">{{ track.city }}</div>
                    </div>

                    <div class="card-body">
                        <h4 class="track-name">{{ track.name }}</h4>

                        <div class="track-meta">
                            <div class="meta-item">
                                <span class="label">长度</span>
                                <span class="val">{{ track.length }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">弯道</span>
                                <span class="val">{{ track.corners }}</span>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="author-info">
                                <div class="avatar-placeholder">{{ track.author[0] }}</div>
                                <div class="text-info">
                                    <span class="author-name">{{ track.author }}</span>
                                    <span class="date">{{ track.createTime }}</span>
                                </div>
                            </div>
                            <div class="stats">
                                ⬇ {{ track.downloads }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="filteredTracks.length === 0" class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>该地区暂无赛道数据，<router-link to="/builder">去创建第一个？</router-link></p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.share-page {
    min-height: 100vh;
    background: #0a0a0a;
    padding-top: 80px;
    /* 避让 Navbar */
    box-sizing: border-box;
}

/* --- 1. HUD 筛选栏 --- */
.filter-hud {
    background: #111;
    border-bottom: 1px solid #333;
    padding: 20px 0;
    margin-bottom: 30px;
}

.hud-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    /* 增加到 24px */
    display: flex;
    gap: 30px;
    align-items: flex-end;
    flex-wrap: wrap;
    box-sizing: border-box;
    /* 关键 */
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-group label {
    color: var(--race-green);
    font-size: 0.7rem;
    font-weight: bold;
    letter-spacing: 1px;
}

/* 科技感输入框/下拉框 */
.tech-select,
.tech-input {
    background: #000;
    border: 1px solid #444;
    color: #fff;
    padding: 10px 15px;
    font-size: 0.95rem;
    border-radius: 0;
    /* 硬朗直角 */
    min-width: 180px;
    outline: none;
    transition: all 0.3s;
}

.tech-select:focus,
.tech-input:focus {
    border-color: var(--race-green);
    box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
}

.search-group {
    margin-left: auto;
}

/* 搜索框推到最右 */

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-wrapper .icon {
    position: absolute;
    right: 10px;
    color: #666;
}

/* --- 2. 网格布局区 --- */
.track-grid-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px 40px;
    /* 上0，左右24，下40 */
    box-sizing: border-box;
    /* 关键 */
}

.grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #222;
    padding-bottom: 10px;
}

.grid-header h3 {
    color: #fff;
    margin: 0;
}

.grid-header .count {
    color: #666;
    font-size: 0.9rem;
}

.sort-opts span {
    color: #666;
    margin-left: 20px;
    cursor: pointer;
    font-size: 0.9rem;
}

.sort-opts span.active {
    color: var(--race-green);
    font-weight: bold;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    /* 自适应列 */
    gap: 30px;
}

/* --- 3. 赛道卡片 --- */
.track-card {
    background: #161616;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
}

.track-card:hover {
    transform: translateY(-5px);
    border-color: var(--race-green);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
}

/* 图片缩略图 */
.card-thumb {
    height: 180px;
    width: 100%;
    position: relative;
    background: #222;
    overflow: hidden;
}

.card-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.track-card:hover .card-thumb img {
    transform: scale(1.1);
}

.loc-tag {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: var(--race-green);
    padding: 4px 8px;
    font-size: 0.7rem;
    border-radius: 2px;
    border: 1px solid var(--race-green);
    backdrop-filter: blur(4px);
}

.thumb-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.track-card:hover .thumb-overlay {
    opacity: 1;
}

.btn-download {
    background: var(--race-green);
    border: none;
    padding: 10px 20px;
    font-weight: bold;
    cursor: pointer;
    transform: translateY(20px);
    transition: transform 0.3s;
}

.track-card:hover .btn-download {
    transform: translateY(0);
}

/* 卡片内容 */
.card-body {
    padding: 15px;
}

.track-name {
    color: #fff;
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-meta {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #2a2a2a;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.meta-item .label {
    font-size: 0.65rem;
    color: #666;
}

.meta-item .val {
    font-size: 0.9rem;
    color: #ccc;
    font-family: monospace;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-placeholder {
    width: 30px;
    height: 30px;
    background: #333;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
}

.text-info {
    display: flex;
    flex-direction: column;
}

.author-name {
    font-size: 0.8rem;
    color: #fff;
}

.date {
    font-size: 0.7rem;
    color: #666;
}

.stats {
    color: var(--race-green);
    font-size: 0.8rem;
    font-family: monospace;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 80px 0;
    color: #666;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
}

.empty-state a {
    color: var(--race-green);
    text-decoration: none;
}

/* 响应式 */
@media (max-width: 768px) {
    .hud-container {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
        padding: 20px 24px;
    }

    .share-page {
        padding-top: 80px;
    }

    .search-group {
        margin-left: 0;
    }

    .grid {
        grid-template-columns: 1fr;
    }
}
</style>