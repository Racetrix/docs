<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useAnalysisCore } from '../composables/useAnalysisCore';
import TelemetrySidebar from '../components/analysis/TelemetrySidebar.vue';
import PlayerControls from '../components/analysis/PlayerControls.vue';
import DesktopOnlyPrompt from '../components/DesktopOnlyPrompt.vue';

const {
    sessions, referenceTrack, isProcessing, statusMsg, isSatelliteMode, playback,
    initMap, toggleMapLayer, handleFileUpload, handleTrackJsonUpload,
    startAnimation, stopAnimation, togglePlay, setSpeed, removeSession
} = useAnalysisCore();

onMounted(() => {
    initMap('analysis-map');
    startAnimation();
});

onUnmounted(() => {
    stopAnimation();
});

const onSeek = (val) => {
    playback.currentTime = val;
    sessions.value.forEach(s => s.lastIndex = 0);
};
</script>

<template>
    <div class="analysis-page">
        <DesktopOnlyPrompt />

        <TelemetrySidebar :sessions="sessions" :is-processing="isProcessing" :status-msg="statusMsg"
            :reference-track="referenceTrack" @upload-csv="handleFileUpload" @upload-track="handleTrackJsonUpload"
            @remove-session="removeSession" />

        <div class="map-stage">
            <div id="analysis-map" :class="{ 'sat-mode': isSatelliteMode }"></div>

            <div v-if="isProcessing" class="center-loading">
                <div class="spinner"></div>
                <div class="loading-text">{{ statusMsg }}</div>
            </div>

            <button class="map-toggle-btn" @click="toggleMapLayer">
                {{ isSatelliteMode ? '显示平面图' : '显示卫星图' }}
            </button>

            <PlayerControls :playback="playback" @toggle-play="togglePlay" @seek="onSeek" @set-speed="setSpeed" />
        </div>
    </div>
</template>

<style scoped>
.analysis-page {
    display: flex;
    height: calc(100vh - 60px);
    padding-top: 80px;
    background: #000;
    box-sizing: border-box;
    overflow: hidden;
}

.map-stage {
    flex: 1;
    position: relative;
    background: #000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#analysis-map {
    flex: 1;
    width: 100%;
    background: #0b0b0b;
    z-index: 1;
}

/* 卫星图模式优化：只变暗底图，不影响车标 */
#analysis-map.sat-mode :deep(.leaflet-tile-pane) {
    filter: brightness(0.6) contrast(1.2) saturate(0.8);
}

.map-toggle-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 500;
    background: rgba(0, 0, 0, 0.85);
    color: var(--race-green);
    border: 1px solid var(--race-green);
    padding: 8px 16px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    border-radius: 4px;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
}

.map-toggle-btn:hover {
    background: var(--race-green);
    color: #000;
}

/* 中央加载动画 */
.center-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    padding: 20px 40px;
    border-radius: 8px;
    border: 1px solid #333;
}

.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #333;
    border-top-color: var(--race-green);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

.loading-text {
    color: #fff;
    font-size: 0.9rem;
    font-weight: bold;
    letter-spacing: 1px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>