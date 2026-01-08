import { ref, reactive, markRaw } from 'vue';
import Papa from 'papaparse';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Leaflet 图标修复 ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function useAnalysisCore() {

    // --- 常量与状态 ---
    const CAR_COLORS = ['#00ff9d', '#ff4757', '#2e86de', '#f39c12', '#9b59b6'];

    const sessions = ref([]);
    const referenceTrack = ref(null);
    const isProcessing = ref(false);
    const statusMsg = ref("支持多车对比 / 赛道校验");
    const isSatelliteMode = ref(false);

    const playback = reactive({
        isPlaying: false,
        currentTime: 0,
        totalDuration: 0,
        speed: 1,
        lastFrameTime: 0
    });

    // 非响应式内部变量
    let map = null;
    let darkLayer = null;
    let satelliteLayer = null;
    let refTrackLayer = null;
    const mapLayers = {};
    const carMarkers = {};

    // --- 算法工具函数 ---

    // 滑动窗口平滑 (去噪)
    const smoothPathData = (pathData, windowSize = 3) => {
        if (pathData.length < windowSize) return pathData;
        const smoothed = JSON.parse(JSON.stringify(pathData));
        for (let i = 0; i < pathData.length; i++) {
            let sumLat = 0, sumLon = 0, count = 0;
            for (let j = Math.max(0, i - windowSize); j < Math.min(pathData.length, i + windowSize + 1); j++) {
                sumLat += pathData[j].lat;
                sumLon += pathData[j].lon;
                count++;
            }
            smoothed[i].lat = sumLat / count;
            smoothed[i].lon = sumLon / count;
        }
        return smoothed;
    };

    // 计算方位角
    const calculateBearing = (lat1, lon1, lat2, lon2) => {
        const y = lat2 - lat1; const x = lon2 - lon1;
        return Math.atan2(x, y) * (180 / Math.PI);
    };

    // 计算距离 (Haversine, 米)
    const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // --- 业务逻辑 ---

    // 赛道越界校验
    const validateSession = (session, refTrack) => {
        if (!refTrack || !refTrack.path_data) { session.isValid = true; return; }
        const trackPoints = refTrack.path_data;
        const limit = (refTrack.config.radius || 10) + 5;
        let offTrackCount = 0;
        const checkStep = 10; // 降采样检查

        for (let i = 0; i < session.data.length; i += checkStep) {
            const carPt = session.data[i];
            let minD = Infinity;
            // 寻找最近赛道点
            for (let j = 0; j < trackPoints.length; j += 5) {
                const d = getDistanceMeters(carPt.lat, carPt.lon, trackPoints[j].lat, trackPoints[j].lon);
                if (d < minD) minD = d;
                if (minD < limit) break;
            }
            if (minD > limit) offTrackCount++;
        }
        session.offTrackCount = offTrackCount;
        session.isValid = offTrackCount < 5; // 容错阈值
    };

    // 初始化地图
    const initMap = (domId) => {
        const container = document.getElementById(domId);
        if (!container) return;
        map = L.map(domId, { zoomControl: false, attributionControl: false }).setView([35.0, 105.0], 4);

        const tileOpts = { maxZoom: 21, subdomains: 'abcd', keepBuffer: 32, updateWhenIdle: false, updateWhenZooming: false };
        darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', tileOpts);
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { ...tileOpts, maxZoom: 18 });
        darkLayer.addTo(map);
    };

    const toggleMapLayer = () => {
        if (!map) return;
        isSatelliteMode.value = !isSatelliteMode.value;
        if (isSatelliteMode.value) { map.removeLayer(darkLayer); map.addLayer(satelliteLayer); }
        else { map.removeLayer(satelliteLayer); map.addLayer(darkLayer); }
    };

    // 绘制参考赛道
    const drawReferenceTrack = (trackData) => {
        if (!map) return;
        if (refTrackLayer) map.removeLayer(refTrackLayer);
        const latlngs = trackData.path_data.map(p => [p.lat, p.lon]);

        refTrackLayer = L.layerGroup([
            L.polyline(latlngs, { color: '#ffffff', weight: (trackData.config.radius || 10) * 2, opacity: 0.1, lineCap: 'round' }),
            L.polyline(latlngs, { color: '#fff', weight: 2, opacity: 0.6, dashArray: '10, 10' })
        ]).addTo(map);
        map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [50, 50] });
    };

    // 处理赛道JSON上传
    const handleTrackJsonUpload = (files) => {
        const file = files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                referenceTrack.value = json;
                drawReferenceTrack(json);
                sessions.value.forEach(s => validateSession(s, json));
                statusMsg.value = `已加载赛道: ${json.meta?.name}`;
            } catch (err) { alert("JSON解析失败"); }
        };
        reader.readAsText(file);
    };

    // 处理CSV上传
    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;
        isProcessing.value = true;
        statusMsg.value = "正在解析...";
        Array.from(files).forEach(parseCsvSession);
    };

    const parseCsvSession = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawText = e.target.result;
            const lines = rawText.split(/\r\n|\n/);

            // 智能Header寻找
            let headerIdx = -1, keys = {};
            const mapping = {
                lat: /^(lat|latitude|pos_lat)$/i, lon: /^(lon|lng|long|longitude|pos_long)$/i,
                time: /^(time|utc|date|timestamp)$/i, speed: /^(speed|spd|gps_speed|speed_kmh)$/i,
                gLat: /^(lat_g|g_lat|accel_x|x_g)$/i, gLon: /^(lon_g|g_lon|accel_y|y_g)$/i,
                fix: /^(fix|gps_fix|quality|status)$/i
            };

            for (let i = 0; i < Math.min(lines.length, 50); i++) {
                const row = lines[i].trim().split(/[,;]/).map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                if (row.find(k => mapping.lat.test(k)) && row.find(k => mapping.lon.test(k))) {
                    headerIdx = i;
                    keys = {
                        lat: row.find(k => mapping.lat.test(k)),
                        lon: row.find(k => mapping.lon.test(k)),
                        time: row.find(k => mapping.time.test(k)),
                        speed: row.find(k => mapping.speed.test(k)),
                        gLat: row.find(k => mapping.gLat.test(k)),
                        gLon: row.find(k => mapping.gLon.test(k)),
                        fix: row.find(k => mapping.fix.test(k))
                    };
                    break;
                }
            }

            if (headerIdx === -1) { alert(`${file.name} 解析失败`); isProcessing.value = false; return; }

            const content = lines.slice(headerIdx).join('\n');
            Papa.parse(content, {
                header: true, dynamicTyping: true, skipEmptyLines: true,
                complete: (results) => {
                    const rawData = results.data;
                    let rawPath = [], startTime = null, duration = 0;

                    for (let i = 0; i < rawData.length; i++) {
                        const row = rawData[i];
                        const lat = row[keys.lat];
                        const lon = row[keys.lon];
                        if (typeof lat === 'number' && lat !== 0) {
                            let relTime = i * 0.1;
                            if (keys.time && row[keys.time]) {
                                const t = new Date(row[keys.time]).getTime();
                                if (!isNaN(t)) {
                                    if (startTime === null) startTime = t;
                                    relTime = (t - startTime) / 1000;
                                }
                            }
                            rawPath.push({
                                lat, lon, relTime,
                                standardData: {
                                    speed: keys.speed ? (row[keys.speed] || 0) : 0,
                                    gLat: keys.gLat ? (row[keys.gLat] || 0) : 0,
                                    gLon: keys.gLon ? (row[keys.gLon] || 0) : 0,
                                    fix: keys.fix ? row[keys.fix] : null
                                },
                                rawData: row
                            });
                        }
                    }

                    if (rawPath.length > 0) duration = rawPath[rawPath.length - 1].relTime;
                    if (duration > playback.totalDuration) playback.totalDuration = duration;

                    const smoothedPath = smoothPathData(rawPath, 3); // 平滑处理

                    const session = {
                        id: Date.now() + Math.random().toString(),
                        name: file.name.replace('.csv', ''),
                        color: CAR_COLORS[sessions.value.length % CAR_COLORS.length],
                        isVisible: true,
                        data: markRaw(smoothedPath),
                        currentFrame: smoothedPath[0] || {},
                        duration,
                        lastIndex: 0,
                        isValid: true,
                        offTrackCount: 0
                    };

                    if (referenceTrack.value) validateSession(session, referenceTrack.value);
                    sessions.value.push(session);
                    drawTrack(session);
                    createCarMarker(session);
                    isProcessing.value = false;
                    statusMsg.value = "准备就绪";
                }
            });
        };
        reader.readAsText(file);
    };

    // 绘制车辆轨迹
    const drawTrack = (session) => {
        if (!map) return;
        const step = Math.ceil(session.data.length / 4000);
        const latlngs = [];
        for (let i = 0; i < session.data.length; i += step) latlngs.push([session.data[i].lat, session.data[i].lon]);
        const polyline = L.polyline(latlngs, { color: session.color, weight: 3, opacity: 0.8 }).addTo(map);
        mapLayers[session.id] = polyline;
        if (!referenceTrack.value && sessions.value.length === 1) map.fitBounds(polyline.getBounds(), { padding: [100, 100] });
    };

    // 创建车辆标记
    const createCarMarker = (session) => {
        const carIcon = L.divIcon({ className: 'car-marker-icon', html: `<div class="car-dot" style="background:${session.color}; box-shadow: 0 0 10px ${session.color}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
        const marker = L.marker([session.data[0].lat, session.data[0].lon], { icon: carIcon }).addTo(map);
        carMarkers[session.id] = marker;
    };

    // 动画循环
    const animationLoop = (timestamp) => {
        if (playback.isPlaying) {
            const dt = (timestamp - playback.lastFrameTime) / 1000;
            playback.currentTime += dt * playback.speed;
            if (playback.currentTime >= playback.totalDuration) {
                playback.currentTime = 0;
                sessions.value.forEach(s => s.lastIndex = 0);
            }
            updateCars();
        }
        playback.lastFrameTime = timestamp;
        requestAnimationFrame(animationLoop);
    };

    const updateCars = () => {
        sessions.value.forEach(session => {
            if (!session.isVisible || session.data.length === 0) return;
            const targetTime = playback.currentTime;
            let nextIdx = -1;

            // 游标搜索优化
            for (let i = session.lastIndex; i < session.data.length; i++) {
                if (session.data[i].relTime > targetTime) { nextIdx = i; break; }
            }
            if (nextIdx === -1 && targetTime < session.duration) {
                for (let i = 0; i < session.data.length; i++) { if (session.data[i].relTime > targetTime) { nextIdx = i; break; } }
            }

            if (nextIdx > 0) {
                session.lastIndex = nextIdx - 1;
                const prev = session.data[nextIdx - 1];
                const next = session.data[nextIdx];
                const t = Math.max(0, Math.min(1, (targetTime - prev.relTime) / (next.relTime - prev.relTime || 1)));

                const curLat = prev.lat + (next.lat - prev.lat) * t;
                const curLon = prev.lon + (next.lon - prev.lon) * t;

                const marker = carMarkers[session.id];
                if (marker) {
                    marker.setLatLng([curLat, curLon]);
                    // 前瞻航向角 (Lookahead)
                    const lookaheadIdx = Math.min(nextIdx + 5, session.data.length - 1);
                    const target = session.data[lookaheadIdx];
                    if (lookaheadIdx > nextIdx) {
                        const angle = calculateBearing(prev.lat, prev.lon, target.lat, target.lon);
                        const iconEl = marker.getElement();
                        if (iconEl && iconEl.querySelector('.car-dot')) iconEl.querySelector('.car-dot').style.transform = `rotate(${angle}deg)`;
                    }
                }
                session.currentFrame = t > 0.5 ? next : prev;
            }
        });
    };

    // 移除会话
    const removeSession = (idx) => {
        const s = sessions.value[idx];
        if (mapLayers[s.id]) map.removeLayer(mapLayers[s.id]);
        if (carMarkers[s.id]) map.removeLayer(carMarkers[s.id]);
        sessions.value.splice(idx, 1);
    };

    return {
        sessions, referenceTrack, isProcessing, statusMsg, isSatelliteMode, playback,
        initMap, toggleMapLayer, handleFileUpload, handleTrackJsonUpload,
        startAnimation: () => requestAnimationFrame(animationLoop),
        stopAnimation: () => { playback.isPlaying = false; },
        togglePlay: () => { playback.isPlaying = !playback.isPlaying; playback.lastFrameTime = performance.now(); },
        setSpeed: (s) => playback.speed = s,
        removeSession
    };
}