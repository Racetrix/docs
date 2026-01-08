<script setup>
const props = defineProps({ playback: Object });
const emit = defineEmits(['togglePlay', 'seek', 'setSpeed']);

const formatTime = (t) => {
    const m = Math.floor(t / 60); const s = Math.floor(t % 60); const ms = Math.floor((t % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
};
</script>

<template>
    <div class="player-controls">
        <div class="control-row">
            <button class="btn-play" @click="emit('togglePlay')">
                {{ playback.isPlaying ? 'PAUSE' : 'PLAY' }}
            </button>

            <div class="time-display">
                {{ formatTime(playback.currentTime) }} / {{ formatTime(playback.totalDuration) }}
            </div>

            <div class="speed-opts">
                <span @click="emit('setSpeed', 1)" :class="{ active: playback.speed === 1 }">1x</span>
                <span @click="emit('setSpeed', 5)" :class="{ active: playback.speed === 5 }">5x</span>
                <span @click="emit('setSpeed', 10)" :class="{ active: playback.speed === 10 }">10x</span>
            </div>
        </div>

        <input type="range" min="0" :max="playback.totalDuration" step="0.05" :value="playback.currentTime"
            @input="emit('seek', parseFloat($event.target.value))" class="seek-slider" />
    </div>
</template>

<style scoped>
.player-controls {
    height: 70px;
    background: #161616;
    border-top: 1px solid #333;
    padding: 5px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    z-index: 500;
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
}

.btn-play {
    background: var(--race-green);
    color: #000;
    border: none;
    padding: 4px 15px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 2px;
    min-width: 60px;
    font-size: 0.8rem;
}

.time-display {
    color: #fff;
    font-family: monospace;
    font-size: 1rem;
}

.speed-opts span {
    color: #555;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px 5px;
}

.speed-opts span.active {
    color: var(--race-green);
}

.seek-slider {
    width: 100%;
    -webkit-appearance: none;
    height: 4px;
    background: #333;
    border-radius: 2px;
    outline: none;
}

.seek-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: var(--race-green);
    border-radius: 50%;
    cursor: pointer;
    margin-top: -4px;
}
</style>