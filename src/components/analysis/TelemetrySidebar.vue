<script setup>
const props = defineProps({
    sessions: Array,
    isProcessing: Boolean,
    statusMsg: String,
    referenceTrack: Object
});

const emit = defineEmits(['uploadCsv', 'uploadTrack', 'removeSession']);

const onCsvChange = (e) => { emit('uploadCsv', e.target.files); e.target.value = ''; };
const onTrackChange = (e) => { emit('uploadTrack', e.target.files); e.target.value = ''; };

const formatTime = (t) => {
    const m = Math.floor(t / 60); const s = Math.floor(t % 60); const ms = Math.floor((t % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
};

const getGBallPos = (gLat, gLon) => {
    const maxG = 1.5; const scale = 45;
    const x = 50 + (Math.min(Math.max(gLat, -maxG), maxG) / maxG) * scale;
    const y = 50 - (Math.min(Math.max(gLon, -maxG), maxG) / maxG) * scale;
    return { x, y };
};
</script>

<template>
    <div class="telemetry-sidebar">
        <div class="sidebar-header">
            <h2>DASHBOARD</h2>
            <div class="action-buttons">
                <label class="btn-upload btn-track">
                    <span>🏁 加载赛道</span>
                    <input type="file" accept=".json" @change="onTrackChange" />
                </label>
                <label class="btn-upload">
                    <span>+ 车辆 CSV</span>
                    <input type="file" multiple accept=".csv" @change="onCsvChange" />
                </label>
            </div>
        </div>

        <div v-if="isProcessing" class="loading-overlay">{{ statusMsg }}</div>

        <div class="sessions-container">
            <div v-if="sessions.length === 0 && !isProcessing" class="empty-state">
                1. 加载赛道 (可选)<br>2. 加载车辆 CSV
            </div>

            <div v-for="(session, idx) in sessions" :key="session.id" class="car-card"
                :style="{ borderTopColor: session.color }">
                <div class="car-info-row">
                    <span class="car-name" :style="{ color: session.color }">{{ session.name }}</span>
                    <div class="controls">
                        <span v-if="referenceTrack && !session.isValid" class="tag-invalid">OFF TRACK</span>
                        <span v-if="referenceTrack && session.isValid" class="tag-valid">VALID LAP</span>
                        <button class="btn-close" @click="emit('removeSession', idx)">×</button>
                    </div>
                </div>

                <div class="dash-cluster">
                    <div class="gauge-box">
                        <div class="gauge-title">SPEED</div>
                        <div class="gauge-circle">
                            <svg viewBox="0 0 100 100">
                                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#333" stroke-width="8"
                                    stroke-linecap="round" />
                                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" :stroke="session.color"
                                    stroke-width="8" stroke-linecap="round" :stroke-dasharray="200"
                                    :stroke-dashoffset="200 - (Math.min(session.currentFrame.standardData?.speed || 0, 200) / 200) * 200"
                                    class="gauge-progress" />
                            </svg>
                            <div class="gauge-val">{{ (session.currentFrame.standardData?.speed || 0).toFixed(0) }}
                            </div>
                            <div class="gauge-unit">km/h</div>
                        </div>
                    </div>
                    <div class="gauge-box">
                        <div class="gauge-title">G-FORCE</div>
                        <div class="g-ball-container">
                            <div class="g-cross-x"></div>
                            <div class="g-cross-y"></div>
                            <div class="g-dot" :style="{
                                left: getGBallPos(session.currentFrame.standardData?.gLat || 0, session.currentFrame.standardData?.gLon || 0).x + '%',
                                top: getGBallPos(session.currentFrame.standardData?.gLat || 0, session.currentFrame.standardData?.gLon || 0).y + '%',
                                backgroundColor: session.color
                            }"></div>
                            <div class="g-val-text">
                                X:{{ (session.currentFrame.standardData?.gLat || 0).toFixed(1) }}
                                Y:{{ (session.currentFrame.standardData?.gLon || 0).toFixed(1) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="status-row">
                    <div class="fix-badge" :class="{ 'fix-ok': session.currentFrame.standardData?.fix > 0 }">
                        FIX: {{ session.currentFrame.standardData?.fix || '-' }}
                    </div>
                    <div class="time-stamp">{{ formatTime(session.currentFrame.relTime || 0) }}</div>
                </div>

                <div class="raw-data-grid">
                    <div v-for="(value, key) in session.currentFrame.rawData" :key="key" class="data-item"
                        v-show="!['Lat', 'Lon', 'Date', 'Time', 'Speed', 'speed', 'lat_g', 'lon_g', 'accel', 'fix', 'pos'].some(f => key.toLowerCase().includes(f))">
                        <span class="d-label">{{ key }}</span>
                        <span class="d-value">{{ typeof value === 'number' ? value.toFixed(2) : value }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 侧边栏专属样式 */
.telemetry-sidebar {
    width: 420px;
    background: #111;
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 1000;
}

.sidebar-header {
    padding: 15px;
    border-bottom: 1px solid #222;
    background: #161616;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sidebar-header h2 {
    margin: 0;
    font-size: 0.9rem;
    color: #fff;
    letter-spacing: 1px;
    font-weight: 800;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.btn-upload {
    background: #222;
    border: 1px solid #444;
    color: #ccc;
    font-size: 0.75rem;
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 4px;
    flex: 1;
    text-align: center;
    font-weight: bold;
    transition: 0.2s;
}

.btn-upload:hover {
    background: #333;
    color: #fff;
    border-color: #666;
}

.btn-upload input {
    display: none;
}

.btn-track {
    border-color: var(--race-green);
    color: var(--race-green);
}

.btn-track:hover {
    background: var(--race-green);
    color: #000;
}

.loading-overlay {
    background: rgba(0, 0, 0, 0.9);
    color: var(--race-green);
    padding: 10px;
    text-align: center;
    border-bottom: 1px solid #333;
}

.sessions-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.empty-state {
    text-align: center;
    color: #555;
    margin-top: 50px;
    font-size: 0.9rem;
    line-height: 1.6;
}

.car-card {
    background: #181818;
    margin-bottom: 15px;
    border-top: 3px solid #666;
    padding: 12px;
    border-radius: 0 0 6px 6px;
}

.car-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.car-name {
    font-weight: bold;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tag-invalid {
    background: #ff4757;
    color: #fff;
    font-size: 0.6rem;
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: bold;
}

.tag-valid {
    background: #2ecc71;
    color: #000;
    font-size: 0.6rem;
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: bold;
}

.btn-close {
    background: none;
    border: none;
    color: #444;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 0.8;
}

.btn-close:hover {
    color: #f00;
}

.dash-cluster {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
}

.gauge-box {
    background: #000;
    border-radius: 4px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    height: 120px;
}

.gauge-title {
    color: #555;
    font-size: 0.65rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.gauge-circle {
    position: relative;
    width: 80px;
    height: 80px;
}

.gauge-val {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Courier New', monospace;
    font-size: 1.4rem;
    font-weight: bold;
    color: #fff;
}

.gauge-unit {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6rem;
    color: #666;
}

.gauge-progress {
    transition: stroke-dashoffset 0.1s linear;
}

.g-ball-container {
    width: 80px;
    height: 80px;
    border: 1px solid #333;
    border-radius: 50%;
    position: relative;
    background: radial-gradient(circle, #111 0%, #000 70%);
}

.g-cross-x,
.g-cross-y {
    position: absolute;
    background: #222;
}

.g-cross-x {
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
}

.g-cross-y {
    left: 50%;
    top: 0;
    width: 1px;
    height: 100%;
}

.g-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 5px currentColor;
    transition: all 0.1s linear;
}

.g-val-text {
    position: absolute;
    bottom: -18px;
    width: 100%;
    text-align: center;
    font-size: 0.6rem;
    color: #666;
    font-family: monospace;
    white-space: nowrap;
}

.status-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.75rem;
    font-family: monospace;
}

.fix-badge {
    padding: 2px 6px;
    background: #333;
    color: #888;
    border-radius: 2px;
}

.fix-badge.fix-ok {
    background: rgba(0, 255, 157, 0.2);
    color: var(--race-green);
}

.time-stamp {
    color: #888;
}

.raw-data-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    border-top: 1px solid #222;
    padding-top: 10px;
}

.data-item {
    background: #111;
    padding: 4px;
    text-align: center;
    border-radius: 2px;
    overflow: hidden;
}

.d-label {
    display: block;
    font-size: 0.55rem;
    color: #555;
    text-transform: uppercase;
    white-space: nowrap;
}

.d-value {
    display: block;
    font-size: 0.8rem;
    color: #ccc;
    font-family: 'Courier New', monospace;
}
</style>