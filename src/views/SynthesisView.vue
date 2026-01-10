<script setup>
import { ref, onMounted, reactive } from 'vue'
import Papa from 'papaparse'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CryptoJS from 'crypto-js'
import DesktopOnlyPrompt from '../components/DesktopOnlyPrompt.vue';

// --- Leaflet 图标修复 ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:#00ff9d; width:14px; height:14px; border-radius:50%; box-shadow:0 0 10px #00ff9d; border:2px solid #fff;"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9]
});
const endIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:#ff4757; width:14px; height:14px; border:2px solid #fff; transform:rotate(45deg); box-shadow:0 0 10px #ff4757;"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8]
});

// --- 状态变量 ---
const csvFile = ref(null)
// [删除] jsonFile, baseJsonData 都不需要了
const statusMsg = ref('请上传 CSV 轨迹文件...')
const processing = ref(false)
const parsedPathData = ref([])
const isSatelliteMode = ref(false)
const pickingMode = ref(null)

const showModal = ref(false)
const exportMeta = reactive({
    trackName: '',
    author: '',
    description: ''
})

const trackConfig = reactive({
    start_point: { lat: 0, lon: 0 },
    end_point: { lat: 0, lon: 0 },
    hasSetStart: false,
    hasSetEnd: false
})

let map = null
let polyline = null
let startMarker = null
let endMarker = null
let darkLayer = null
let satelliteLayer = null

onMounted(() => { initMap() })

const initMap = () => {
    const container = document.getElementById('map-container')
    if (!container) return
    map = L.map('map-container', { zoomControl: false, attributionControl: false, minZoom: 2 }).setView([35.0, 105.0], 4)
    const layerOpts = { maxZoom: 20, subdomains: 'abcd', keepBuffer: 8, updateWhenIdle: false }
    darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', layerOpts)
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { ...layerOpts, maxZoom: 18 })
    darkLayer.addTo(map)
    map.on('click', (e) => { if (pickingMode.value) handleMapPick(e.latlng) })
}

const toggleMapLayer = () => {
    if (!map) return
    isSatelliteMode.value = !isSatelliteMode.value
    if (isSatelliteMode.value) { map.removeLayer(darkLayer); map.addLayer(satelliteLayer) }
    else { map.removeLayer(satelliteLayer); map.addLayer(darkLayer) }
}

const handleCsvUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    processing.value = true
    csvFile.value = file.name
    statusMsg.value = "正在解析 CSV..."

    const reader = new FileReader()
    reader.onload = (e) => {
        const rawText = e.target.result
        const lines = rawText.split(/\r\n|\n/)
        let headerLineIndex = -1
        let foundLatKey = null
        let foundLonKey = null
        const latRegex = /^(lat|latitude|pos_lat|gps_lat)$/i
        const lonRegex = /^(lon|lng|long|longitude|pos_long|gps_long)$/i

        for (let i = 0; i < Math.min(lines.length, 30); i++) {
            const potentialHeaders = lines[i].trim().split(/[,;]/).map(h => h.trim().replace(/^['"]|['"]$/g, ''))
            const hasLat = potentialHeaders.find(h => latRegex.test(h))
            const hasLon = potentialHeaders.find(h => lonRegex.test(h))
            if (hasLat && hasLon) {
                headerLineIndex = i; foundLatKey = hasLat; foundLonKey = hasLon; break
            }
        }

        if (headerLineIndex === -1) { handleError("无法识别 CSV 格式：未找到 Lat/Lon 列。"); return }

        const cleanCsvContent = lines.slice(headerLineIndex).join('\n')
        Papa.parse(cleanCsvContent, {
            header: true, skipEmptyLines: true, dynamicTyping: true,
            complete: (results) => {
                const rows = results.data
                const fullPath = []
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i]
                    const lat = parseFloat(row[foundLatKey])
                    const lon = parseFloat(row[foundLonKey])
                    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) fullPath.push({ lat, lon })
                }
                if (fullPath.length < 2) { handleError(`无有效轨迹数据。`); return }

                parsedPathData.value = fullPath
                drawPathOnMap(fullPath)

                // 默认设置起终点为轨迹的首尾（作为初始建议，用户可修改）
                if (!trackConfig.hasSetStart) updateStartPoint(fullPath[0], false)
                if (!trackConfig.hasSetEnd) updateEndPoint(fullPath[fullPath.length - 1], false)

                statusMsg.value = `导入成功: ${fullPath.length} 个点`
                processing.value = false
            },
            error: (err) => handleError("CSV 解析出错: " + err.message)
        })
    }
    reader.readAsText(file)
}

const handleError = (msg) => { statusMsg.value = msg; processing.value = false; alert(msg) }

const drawPathOnMap = (fullData) => {
    if (!map) return
    const displayPoints = []
    const total = fullData.length
    const step = total > 5000 ? Math.ceil(total / 5000) : 1
    for (let i = 0; i < total; i += step) displayPoints.push([fullData[i].lat, fullData[i].lon])
    displayPoints.push([fullData[total - 1].lat, fullData[total - 1].lon])
    if (polyline) map.removeLayer(polyline)
    polyline = L.polyline(displayPoints, { color: '#00ff9d', weight: 4, opacity: 1, lineJoin: 'round', smoothFactor: 1 }).addTo(map)
    map.fitBounds(polyline.getBounds(), { padding: [80, 80] })
}

const startPicking = (mode) => { pickingMode.value = mode; statusMsg.value = `请在地图上点击设置${mode === 'start' ? '起点' : '终点'}...` }

const handleMapPick = (latlng) => {
    const pt = { lat: latlng.lat, lon: latlng.lng }
    if (pickingMode.value === 'start') updateStartPoint(pt, true)
    else if (pickingMode.value === 'end') updateEndPoint(pt, true)
    pickingMode.value = null
    statusMsg.value = "坐标已手动更新"
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

const openExportModal = () => {
    if (parsedPathData.value.length === 0) return
    showModal.value = true
}

// --- 辅助函数：限制坐标精度 (最多保留7位小数) ---
const fmt = (num) => {
    // 使用 parseFloat + toFixed(7) 可以去掉末尾多余的 0
    // 例如: 12.123456789 -> 12.1234568, 12.10000 -> 12.1
    return parseFloat(Number(num).toFixed(8))
}

// --- 辅助函数：在轨迹数组中寻找最近点的索引 ---
const findNearestIndex = (targetPt, pathArray) => {
    let minDist = Infinity
    let index = -1
    for (let i = 0; i < pathArray.length; i++) {
        const p = pathArray[i]
        // 简单的欧几里得距离平方 (不需要开根号，比较大小即可)
        const dist = Math.pow(p.lat - targetPt.lat, 2) + Math.pow(p.lon - targetPt.lon, 2)
        if (dist < minDist) {
            minDist = dist
            index = i
        }
    }
    return index
}

// [修改] 确认导出逻辑 (含剪裁与精度控制)
const confirmExport = () => {
    showModal.value = false

    // 1. 寻找切割点
    // 根据用户在地图上点击的起终点，去 CSV 原始数据里找“最近的那个点”是第几行
    const rawData = parsedPathData.value

    let startIdx = 0
    let endIdx = rawData.length - 1

    // 如果用户设置了起点，找最近的索引
    if (trackConfig.hasSetStart) {
        startIdx = findNearestIndex(trackConfig.start_point, rawData)
    }

    // 如果用户设置了终点，找最近的索引
    if (trackConfig.hasSetEnd) {
        endIdx = findNearestIndex(trackConfig.end_point, rawData)
    } else {
        // 如果没设终点（闭环赛道），且设置了起点，通常意味着“跑一圈回到起点”
        // 但这里为了安全，如果是闭环，我们默认终点就是数据的最后一个点
        // 或者用户应该手动指定终点来完成剪裁
        // 这里的逻辑保持：没设终点就用到最后
    }

    // 容错处理：如果起点比终点还晚，交换它们（防止切出空数组）
    if (startIdx > endIdx) {
        const temp = startIdx
        startIdx = endIdx
        endIdx = temp
    }

    // 2. 执行剪裁 (只保留 startIdx 到 endIdx 之间的数据)
    const slicedPath = rawData.slice(startIdx, endIdx + 1).map(p => ({
        lat: fmt(p.lat),
        lon: fmt(p.lon)
    }))

    // 3. 准备起终点坐标 (也进行精度格式化)
    // 注意：这里使用“切割后的轨迹”的首尾点作为配置里的起终点，
    // 这样能保证 config.start_point 完美贴合 path_data[0]
    const finalStartPoint = {
        lat: fmt(slicedPath[0].lat),
        lon: fmt(slicedPath[0].lon)
    }

    const finalEndPoint = {
        lat: fmt(slicedPath[slicedPath.length - 1].lat),
        lon: fmt(slicedPath[slicedPath.length - 1].lon)
    }

    // 4. 构建 JSON
    const finalObj = {
        meta: {
            name: exportMeta.trackName || 'Untitled Track',
            author: exportMeta.author || 'Anonymous',
            description: exportMeta.description || 'Generated by RaceTrix Builder',
            createTime: new Date().toISOString().split('T')[0],
            version: "1.0"
        },
        config: {
            start_point: finalStartPoint,
            end_point: finalEndPoint,
            track_width: 12,
            sectors: []
        },
        path_data: slicedPath, // 使用剪裁+格式化后的数据
        security: {}
    }

    // 5. 生成签名
    const tempForHash = JSON.parse(JSON.stringify(finalObj))
    if (tempForHash.security) delete tempForHash.security.signature
    const hash = CryptoJS.SHA256(JSON.stringify(tempForHash)).toString()
    finalObj.security = { algorithm: "SHA-256", signature: hash }

    // 6. 下载
    const blob = new Blob([JSON.stringify(finalObj, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeName = (exportMeta.trackName || 'track').replace(/[^a-z0-9_\u4e00-\u9fa5]/gi, '_')
    link.download = `${safeName}.json`
    link.click()

    // 7. 更新状态提示
    statusMsg.value = `生成成功！已剪裁数据: ${rawData.length} -> ${slicedPath.length} 点`
}
</script>

<template>
    <div class="synthesis-page">
        <DesktopOnlyPrompt />

        <div class="modal-overlay" v-if="showModal">
            <div class="modal-box">
                <div class="modal-header">
                    <h3>生成赛道配置</h3>
                    <button class="close-btn" @click="showModal = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>赛道名称 (必填)</label>
                        <input type="text" v-model="exportMeta.trackName" placeholder="例如：Beijing Goldenport"
                            class="modal-input">
                    </div>
                    <div class="form-group">
                        <label>作者 / Maintainer</label>
                        <input type="text" v-model="exportMeta.author" placeholder="你的名字" class="modal-input">
                    </div>
                    <div class="form-group">
                        <label>备注 / Description</label>
                        <textarea v-model="exportMeta.description" placeholder="赛道简介..."
                            class="modal-textarea"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" @click="showModal = false">取消</button>
                    <button class="btn-confirm" @click="confirmExport">生成 JSON 文件</button>
                </div>
            </div>
        </div>

        <div class="workspace">
            <div class="panel control-panel">
                <h2>1. 导入数据</h2>
                <div class="upload-group">
                    <label class="file-label">
                        <span class="step-badge">CSV</span>
                        <div class="text-info">
                            <span class="title">上传轨迹记录</span>
                            <span class="filename">{{ csvFile || '支持 Lat/Lon 格式' }}</span>
                        </div>
                        <input type="file" accept=".csv" @change="handleCsvUpload" />
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
                    <div class="coord-val">
                        {{ trackConfig.hasSetStart ? `${trackConfig.start_point.lat.toFixed(7)},
                        ${trackConfig.start_point.lon.toFixed(7)}` : '--' }}
                    </div>

                    <div class="coord-row" style="margin-top:10px;">
                        <div class="coord-label"><span class="dot end-dot"></span> 终点</div>
                        <button class="btn-pick" :class="{ 'active': pickingMode === 'end' }"
                            @click="startPicking('end')">
                            {{ pickingMode === 'end' ? '点击地图...' : '拾取' }}
                        </button>
                    </div>
                    <div class="coord-val">
                        {{ trackConfig.hasSetEnd ? `${trackConfig.end_point.lat.toFixed(7)},
                        ${trackConfig.end_point.lon.toFixed(7)}` : '--' }}
                    </div>
                </div>

                <div class="status-bar">
                    <div class="status-indicator" :class="{ 'active': processing }"></div>
                    <span class="status-text">{{ statusMsg }}</span>
                </div>

                <button class="btn-generate" :disabled="parsedPathData.length === 0" @click="openExportModal">
                    <span class="icon">⚡</span> 生成并下载
                </button>
            </div>

            <div class="panel map-panel">
                <div id="map-container" :class="{ 'sat-mode': isSatelliteMode, 'picking': pickingMode }"></div>
                <div class="map-controls">
                    <button class="map-toggle-btn" @click="toggleMapLayer">
                        {{ isSatelliteMode ? '卫星图 ON' : '卫星图 OFF' }}
                    </button>
                </div>
                <div class="pick-toast" v-if="pickingMode">请点击地图位置以设置{{ pickingMode === 'start' ? '起点' : '终点' }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 保持原有样式，仅移除多余部分 */
.synthesis-page {
    padding: 100px 20px 20px;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.workspace {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 20px;
    flex: 1;
    min-height: 600px;
}

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

#map-container {
    width: 100%;
    height: 100%;
    background: #0b0b0b;
}

#map-container.picking {
    cursor: crosshair !important;
}

#map-container.sat-mode :deep(.leaflet-tile-pane) {
    filter: brightness(0.7) contrast(1.1);
}

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
    width: 40px;
    height: 24px;
    font-size: 0.7rem;
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

/* Modal 样式复用 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
}

.modal-box {
    background: #111;
    border: 1px solid var(--race-green);
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 0 30px rgba(0, 255, 157, 0.15);
    animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.modal-header {
    background: #1a1a1a;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #333;
}

.modal-header h3 {
    color: #fff;
    margin: 0;
    font-size: 1rem;
    border: none;
    padding: 0;
}

.close-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
}

.close-btn:hover {
    color: #fff;
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    color: #888;
    font-size: 0.8rem;
    margin-bottom: 6px;
    font-weight: bold;
}

.modal-input,
.modal-textarea {
    width: 100%;
    background: #000;
    border: 1px solid #444;
    color: #fff;
    padding: 10px;
    font-size: 0.9rem;
    border-radius: 4px;
    box-sizing: border-box;
    transition: 0.3s;
}

.modal-input:focus,
.modal-textarea:focus {
    border-color: var(--race-green);
    outline: none;
}

.modal-textarea {
    height: 80px;
    resize: vertical;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #333;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel {
    background: transparent;
    border: 1px solid #444;
    color: #aaa;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-cancel:hover {
    color: #fff;
    border-color: #fff;
}

.btn-confirm {
    background: var(--race-green);
    border: none;
    color: #000;
    padding: 8px 20px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
}

.btn-confirm:hover {
    box-shadow: 0 0 10px rgba(0, 255, 157, 0.4);
}

@keyframes popIn {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>