<script setup>
import { ref, onMounted, reactive } from 'vue'
import Papa from 'papaparse'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CryptoJS from 'crypto-js'
import DesktopOnlyPrompt from '../components/DesktopOnlyPrompt.vue';

// --- 1. Leaflet 图标资源修复 (Vite 环境必需) ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 2. 自定义起点/终点图标样式 ---
const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:#00ff9d; width:14px; height:14px; border-radius:50%; box-shadow:0 0 10px #00ff9d; border:2px solid #fff;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});
const endIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:#ff4757; width:14px; height:14px; border:2px solid #fff; transform:rotate(45deg); box-shadow:0 0 10px #ff4757;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// --- 3. 状态变量 ---
const csvFile = ref(null)
const jsonFile = ref(null)
const statusMsg = ref('准备就绪，请上传数据...')
const processing = ref(false)
const parsedPathData = ref([]) // 这里存储完整的原始数据（用于下载）
const baseJsonData = ref(null)
const isSatelliteMode = ref(false)
const pickingMode = ref(null) // 'start' 或 'end'

// 赛道配置对象
const trackConfig = reactive({
    start_point: { lat: 0, lon: 0 },
    end_point: { lat: 0, lon: 0 },
    hasSetStart: false,
    hasSetEnd: false
})

// 地图实例引用
let map = null
let polyline = null
let startMarker = null
let endMarker = null
let darkLayer = null
let satelliteLayer = null

onMounted(() => {
    initMap()
})

// --- 4. 地图初始化 (包含防卡顿优化) ---
const initMap = () => {
    const container = document.getElementById('map-container')
    if (!container) return

    map = L.map('map-container', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2 // 防止缩小过多
    }).setView([35.0, 105.0], 4) // 默认显示宏观视角

    // 关键优化：keepBuffer: 8 确保缩放时周围的瓦片不被销毁，减少闪烁
    const layerOpts = { maxZoom: 20, subdomains: 'abcd', keepBuffer: 8, updateWhenIdle: false }

    darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', layerOpts)
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { ...layerOpts, maxZoom: 18 })

    darkLayer.addTo(map)

    // 绑定地图点击事件（用于拾取坐标）
    map.on('click', (e) => {
        if (pickingMode.value) handleMapPick(e.latlng)
    })
}

const toggleMapLayer = () => {
    if (!map) return
    isSatelliteMode.value = !isSatelliteMode.value
    if (isSatelliteMode.value) {
        map.removeLayer(darkLayer); map.addLayer(satelliteLayer)
    } else {
        map.removeLayer(satelliteLayer); map.addLayer(darkLayer)
    }
}

// --- 替换原有的 handleCsvUpload 函数 ---
const handleCsvUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    processing.value = true
    csvFile.value = file.name
    statusMsg.value = "正在智能解析 CSV..."

    // 使用 FileReader 先读取文本，手动寻找 Header 行，解决头部有垃圾信息的问题
    const reader = new FileReader()
    reader.onload = (e) => {
        const rawText = e.target.result
        const lines = rawText.split(/\r\n|\n/)

        // 1. 智能寻找标题行 (在前 30 行里找)
        let headerLineIndex = -1
        let foundLatKey = null
        let foundLonKey = null

        // 定义我们支持的列名变种 (正则)
        const latRegex = /^(lat|latitude|pos_lat|gps_lat)$/i
        const lonRegex = /^(lon|lng|long|longitude|pos_long|gps_long)$/i

        for (let i = 0; i < Math.min(lines.length, 30); i++) {
            // 尝试用逗号或分号分割这一行
            const potentialHeaders = lines[i].trim().split(/[,;]/).map(h => h.trim().replace(/^['"]|['"]$/g, '')) // 去除首尾引号

            // 检查这一行是否同时包含“纬度”和“经度”的关键词
            const hasLat = potentialHeaders.find(h => latRegex.test(h))
            const hasLon = potentialHeaders.find(h => lonRegex.test(h))

            if (hasLat && hasLon) {
                headerLineIndex = i
                foundLatKey = hasLat
                foundLonKey = hasLon
                console.log(`[CSV调试] 在第 ${i + 1} 行找到标题: Lat='${hasLat}', Lon='${hasLon}'`)
                break
            }
        }

        if (headerLineIndex === -1) {
            handleError("无法识别 CSV 格式：未在前 30 行找到 Lat/Lon 列名。请检查文件。")
            return
        }

        // 2. 截取有效内容传给 PapaParse (只解析标题行及之后的数据)
        const cleanCsvContent = lines.slice(headerLineIndex).join('\n')

        Papa.parse(cleanCsvContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                const rows = results.data
                const fullPath = []

                // 3. 提取数据
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i]
                    const lat = parseFloat(row[foundLatKey])
                    const lon = parseFloat(row[foundLonKey])

                    // 严格检查是否为有效数字 (排除 NaN, null, 0)
                    // 注意：有些赛道经纬度确实可能接近0，但在中国赛道 Lat/Lon 绝不会是 0
                    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                        fullPath.push({ lat, lon })
                    }
                }

                if (fullPath.length < 2) {
                    console.error("解析结果为空。首行数据示例:", rows[0])
                    handleError(`找到列名但无有效数据。可能解析器没能正确识别数字。`)
                    return
                }

                // --- 成功逻辑 ---
                parsedPathData.value = fullPath
                drawPathOnMap(fullPath)

                if (!trackConfig.hasSetStart) updateStartPoint(fullPath[0], false)
                if (!trackConfig.hasSetEnd) updateEndPoint(fullPath[fullPath.length - 1], false)

                statusMsg.value = `解析成功: 包含 ${fullPath.length} 个轨迹点 (跳过头部 ${headerLineIndex} 行)`
                processing.value = false
            },
            error: (err) => handleError("CSV 解析出错: " + err.message)
        })
    }

    // 开始读取文件
    reader.readAsText(file)
}

const isValidCoord = (val) => typeof val === 'number' && !isNaN(val) && val !== 0

const handleError = (msg) => {
    statusMsg.value = msg
    processing.value = false
    alert(msg)
}

// --- 6. 路径绘制 (性能优化版) ---
const drawPathOnMap = (fullData) => {
    if (!map) return

    // 性能优化：如果点太多 (>5000)，地图渲染会卡。
    // 我们在显示时进行降采样（只抽样显示），但在下载时依然保存完整数据。
    const displayPoints = []
    const total = fullData.length
    // 目标是在地图上保留约 3000-5000 个关键点，既保证线条平滑又不卡顿
    const step = total > 5000 ? Math.ceil(total / 5000) : 1

    for (let i = 0; i < total; i += step) {
        displayPoints.push([fullData[i].lat, fullData[i].lon])
    }
    // 确保最后一个点总是被包含，闭合视觉
    displayPoints.push([fullData[total - 1].lat, fullData[total - 1].lon])

    if (polyline) map.removeLayer(polyline)

    // 绘制路线
    polyline = L.polyline(displayPoints, {
        color: '#00ff9d', // 赛车绿
        weight: 4,        // 线条宽度
        opacity: 1,
        lineJoin: 'round',
        smoothFactor: 1   // 平滑因子
    }).addTo(map)

    // 自动缩放视野到赛道
    map.fitBounds(polyline.getBounds(), { padding: [80, 80] })

    if (step > 1) {
        console.log(`显示优化开启: 原始点数 ${total}, 显示点数 ${displayPoints.length}`)
    }
}

// --- 7. JSON 处理与打点逻辑 (保持不变) ---
const handleJsonUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result)
            baseJsonData.value = json
            jsonFile.value = file.name
            if (json.config?.start_point) updateStartPoint(json.config.start_point, true)
            if (json.config?.end_point) updateEndPoint(json.config.end_point, true)
        } catch { handleError("JSON 格式错误") }
    }
    reader.readAsText(file)
}

const startPicking = (mode) => { pickingMode.value = mode; statusMsg.value = "请在地图轨迹上点击位置..." }

const handleMapPick = (latlng) => {
    const pt = { lat: latlng.lat, lon: latlng.lng }
    if (pickingMode.value === 'start') updateStartPoint(pt, true)
    else if (pickingMode.value === 'end') updateEndPoint(pt, true)
    pickingMode.value = null
    statusMsg.value = "坐标已更新"
}

const updateStartPoint = (coords, isManual) => {
    trackConfig.start_point = { lat: coords.lat, lon: coords.lon }
    trackConfig.hasSetStart = true
    if (startMarker) map.removeLayer(startMarker)
    startMarker = L.marker([coords.lat, coords.lon], { icon: startIcon }).addTo(map).bindPopup("起点").openPopup()
}

const updateEndPoint = (coords, isManual) => {
    trackConfig.end_point = { lat: coords.lat, lon: coords.lon }
    trackConfig.hasSetEnd = true
    if (endMarker) map.removeLayer(endMarker)
    endMarker = L.marker([coords.lat, coords.lon], { icon: endIcon }).addTo(map).bindPopup("终点")
}

const generateAndDownload = () => {
    if (!baseJsonData.value || parsedPathData.value.length === 0) return
    const finalObj = JSON.parse(JSON.stringify(baseJsonData.value))

    // 注入完整数据
    finalObj.path_data = parsedPathData.value
    finalObj.config.start_point = trackConfig.start_point
    finalObj.config.end_point = trackConfig.hasSetEnd ? trackConfig.end_point : trackConfig.start_point

    const tempForHash = JSON.parse(JSON.stringify(finalObj))
    if (tempForHash.security) delete tempForHash.security.signature
    const hash = CryptoJS.SHA256(JSON.stringify(tempForHash)).toString()
    finalObj.security = { algorithm: "SHA-256", signature: hash }

    const blob = new Blob([JSON.stringify(finalObj, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${finalObj.meta.name}_Full.json`
    link.click()
    statusMsg.value = "下载成功！"
}
</script>

<template>
    <div class="synthesis-page">
        <DesktopOnlyPrompt />
        <div class="workspace">
            <div class="panel control-panel">
                <h2>1. 导入数据</h2>
                <div class="upload-group">
                    <label class="file-label">
                        <span class="step-badge">A</span>
                        <div class="text-info">
                            <span class="title">CSV 轨迹记录</span>
                            <span class="filename">{{ csvFile || '支持 Lat/Lon, lat/lng 等格式' }}</span>
                        </div>
                        <input type="file" accept=".csv" @change="handleCsvUpload" />
                    </label>
                </div>
                <div class="upload-group">
                    <label class="file-label">
                        <span class="step-badge">B</span>
                        <div class="text-info">
                            <span class="title">JSON 配置文件</span>
                            <span class="filename">{{ jsonFile || '元数据文件' }}</span>
                        </div>
                        <input type="file" accept=".json" @change="handleJsonUpload" />
                    </label>
                </div>

                <div class="separator"></div>

                <h2>2. 赛道定义</h2>
                <div class="track-setting-group">
                    <div class="coord-row">
                        <div class="coord-label"><span class="dot start-dot"></span> 起点</div>
                        <button class="btn-pick" :class="{ 'active': pickingMode === 'start' }"
                            @click="startPicking('start')">
                            {{ pickingMode === 'start' ? '点击地图...' : '拾取' }}
                        </button>
                    </div>
                    <div class="coord-val">{{ trackConfig.hasSetStart ? `${trackConfig.start_point.lat.toFixed(6)}, ...`
                        : '--' }}</div>

                    <div class="coord-row" style="margin-top:10px;">
                        <div class="coord-label"><span class="dot end-dot"></span> 终点</div>
                        <button class="btn-pick" :class="{ 'active': pickingMode === 'end' }"
                            @click="startPicking('end')">
                            {{ pickingMode === 'end' ? '点击地图...' : '拾取' }}
                        </button>
                    </div>
                    <div class="coord-val">{{ trackConfig.hasSetEnd ? `${trackConfig.end_point.lat.toFixed(6)}, ...` :
                        '--' }}</div>
                </div>

                <div class="status-bar">
                    <div class="status-indicator" :class="{ 'active': processing }"></div>
                    <span class="status-text">{{ statusMsg }}</span>
                </div>

                <button class="btn-generate" :disabled="!baseJsonData || parsedPathData.length === 0"
                    @click="generateAndDownload">
                    <span class="icon">⚡</span> 合成赛道
                </button>
            </div>

            <div class="panel map-panel">
                <div id="map-container" :class="{ 'sat-mode': isSatelliteMode, 'picking': pickingMode }"></div>
                <div class="map-controls">
                    <button class="map-toggle-btn" @click="toggleMapLayer">
                        {{ isSatelliteMode ? '卫星图 ON' : '卫星图 OFF' }}
                    </button>
                </div>
                <div class="pick-toast" v-if="pickingMode">请在地图路径上点击以设置{{ pickingMode === 'start' ? '起点' : '终点' }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- 布局修复与样式 --- */

/* 修复 Header 遮挡问题 */
.synthesis-page {
    padding: 100px 20px 20px;
    /* 顶部留足 100px */
    min-height: calc(100vh - 60px);
    /* 配合 Flex Footer */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.workspace {
    display: grid;
    grid-template-columns: 300px 1fr;
    /* 左侧稍微窄一点更精致 */
    gap: 20px;
    flex: 1;
    /* 撑满剩余高度 */
    min-height: 600px;
}

/* 面板风格 */
.panel {
    background: #161616;
    border: 1px solid #333;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
}

.control-panel {
    padding: 20px;
    overflow-y: auto;
    max-height: 80vh;
}

.map-panel {
    position: relative;
    padding: 0;
    overflow: hidden;
    border-radius: 6px;
}

/* 地图容器 */
#map-container {
    width: 100%;
    height: 100%;
    background: #0b0b0b;
}

#map-container.picking {
    cursor: crosshair !important;
}

/* 卫星图模式加滤镜，让绿线更清晰 */
#map-container.sat-mode :deep(.leaflet-tile-pane) {
    filter: brightness(0.7) contrast(1.1);
}

/* 左侧控件样式 */
h2 {
    color: var(--race-green);
    font-size: 0.9rem;
    margin: 0 0 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 800;
    border-left: 3px solid var(--race-green);
    padding-left: 10px;
}

.separator {
    height: 1px;
    background: #2a2a2a;
    margin: 20px 0;
}

.file-label {
    display: flex;
    align-items: center;
    background: #222;
    border: 1px solid #333;
    padding: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: 0.2s;
}

.file-label:hover {
    border-color: var(--race-green);
    background: #262626;
}

.step-badge {
    background: #333;
    color: #fff;
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-right: 12px;
    font-weight: bold;
}

.text-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.text-info .title {
    color: #ddd;
    font-size: 0.85rem;
    font-weight: bold;
}

.text-info .filename {
    color: var(--race-green);
    font-size: 0.75rem;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.upload-group input {
    display: none;
}

.upload-group {
    margin-bottom: 12px;
}

.track-setting-group {
    background: #1a1a1a;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #2a2a2a;
}

.coord-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.coord-label {
    color: #ccc;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
}

.start-dot {
    background: #00ff9d;
    box-shadow: 0 0 4px #00ff9d;
}

.end-dot {
    background: #ff4757;
    box-shadow: 0 0 4px #ff4757;
}

.coord-val {
    font-family: monospace;
    color: #666;
    font-size: 0.75rem;
    margin-top: 4px;
    padding-left: 16px;
}

.btn-pick {
    background: transparent;
    border: 1px solid #444;
    color: #aaa;
    padding: 3px 8px;
    font-size: 0.7rem;
    cursor: pointer;
    border-radius: 2px;
    transition: 0.2s;
}

.btn-pick:hover {
    color: #fff;
    border-color: #fff;
}

.btn-pick.active {
    background: var(--race-green);
    color: #000;
    border-color: var(--race-green);
    font-weight: bold;
}

.btn-generate {
    margin-top: auto;
    background: var(--race-green);
    color: #000;
    border: none;
    padding: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 4px;
    transition: 0.2s;
    font-size: 0.95rem;
}

.btn-generate:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
}

.btn-generate:hover:not(:disabled) {
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.status-bar {
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #888;
    height: 20px;
}

.status-indicator {
    width: 6px;
    height: 6px;
    background: #444;
    border-radius: 50%;
}

.status-indicator.active {
    background: var(--race-green);
    animation: blink 1s infinite;
}

.status-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 地图按钮 */
.map-controls {
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 500;
}

.map-toggle-btn {
    background: rgba(0, 0, 0, 0.8);
    color: var(--race-green);
    border: 1px solid var(--race-green);
    padding: 6px 12px;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    backdrop-filter: blur(4px);
}

.map-toggle-btn:hover {
    background: var(--race-green);
    color: #000;
}

.pick-toast {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 8px 20px;
    border-radius: 20px;
    border: 1px solid var(--race-green);
    font-size: 0.85rem;
    z-index: 600;
    pointer-events: none;
}

@keyframes blink {
    50% {
        opacity: 0.4;
    }
}

@media (max-width: 900px) {
    .synthesis-page {
        padding-top: 80px;
    }

    .workspace {
        grid-template-columns: 1fr;
    }

    .map-panel {
        height: 400px;
    }
}
</style>