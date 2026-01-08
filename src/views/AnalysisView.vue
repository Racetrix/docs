<script setup>
import { onMounted, onUnmounted } from 'vue';
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

onUnmounted(() => { stopAnimation(); });

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
            <div class="sat-overlay" v-if="isSatelliteMode"></div>

            <button class="map-toggle-btn" @click="toggleMapLayer">
                {{ isSatelliteMode ? '卫星图' : '平面图' }}
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
}

.sat-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 400;
}

.map-toggle-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 500;
    background: rgba(0, 0, 0, 0.8);
    color: var(--race-green);
    border: 1px solid var(--race-green);
    padding: 5px 10px;
    font-size: 0.7rem;
    cursor: pointer;
}
</style>