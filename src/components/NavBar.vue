<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const route = useRoute()

const handleScroll = () => { isScrolled.value = window.scrollY > 50 }
const toggleMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value }

watch(route, () => { isMobileMenuOpen.value = false })

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled, 'mobile-open': isMobileMenuOpen }">
    <div class="container">

      <router-link to="/" class="logo" data-text="RACETRIX">
        RACE<span class="highlight">TRIX</span>
      </router-link>

      <div class="mobile-menu-icon" @click="toggleMenu" :class="{ 'active': isMobileMenuOpen }">
        <span></span><span></span><span></span>
      </div>

      <nav class="nav-links" :class="{ 'mobile-visible': isMobileMenuOpen }">
        <router-link to="/">首页</router-link>
        <router-link to="/analysis">数据分析</router-link>
        <router-link to="/hardware">硬件支持</router-link>
        <router-link to="/share">赛道社区</router-link>
        <router-link to="/faq">常见问题</router-link> <router-link to="/builder" class="nav-btn">赛道构建</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* --- 基础布局 --- */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  padding: 1.2rem 0;
  transition: all 0.3s ease;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
}

.navbar.scrolled {
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.8rem 0;
}

.navbar.mobile-open {
  background: #0a0a0a;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* --- LOGO 故障风核心样式 --- */
.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  font-style: italic;
  display: flex;
  align-items: center;
  letter-spacing: 1px;
  position: relative;
  /* 必须是 relative */
  z-index: 1002;
}

.logo .highlight {
  color: var(--race-green);
}

/* 故障幻影层 1 (洋红色偏移) */
.logo::before {
  content: attr(data-text);
  position: absolute;
  left: -2px;
  text-shadow: 2px 0 #ff00c1;
  top: 0;
  color: #fff;
  background: #0a0a0a;
  /* 与背景色一致，制造切割感 */
  overflow: hidden;
  clip: rect(0, 900px, 0, 0);
  animation: glitch-anim-1 2s infinite linear alternate-reverse;
}

/* 故障幻影层 2 (赛车绿偏移) */
.logo::after {
  content: attr(data-text);
  position: absolute;
  left: 2px;
  text-shadow: -2px 0 var(--race-green);
  top: 0;
  color: #fff;
  background: #0a0a0a;
  overflow: hidden;
  clip: rect(0, 900px, 0, 0);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}

/* 动画关键帧：随机剪裁区域 */
@keyframes glitch-anim-1 {
  0% {
    clip: rect(20px, 9999px, 15px, 0);
  }

  20% {
    clip: rect(60px, 9999px, 80px, 0);
  }

  40% {
    clip: rect(10px, 9999px, 55px, 0);
  }

  60% {
    clip: rect(80px, 9999px, 25px, 0);
  }

  80% {
    clip: rect(40px, 9999px, 10px, 0);
  }

  100% {
    clip: rect(70px, 9999px, 90px, 0);
  }
}

@keyframes glitch-anim-2 {
  0% {
    clip: rect(65px, 9999px, 100px, 0);
  }

  20% {
    clip: rect(10px, 9999px, 50px, 0);
  }

  40% {
    clip: rect(90px, 9999px, 20px, 0);
  }

  60% {
    clip: rect(15px, 9999px, 60px, 0);
  }

  80% {
    clip: rect(55px, 9999px, 10px, 0);
  }

  100% {
    clip: rect(30px, 9999px, 70px, 0);
  }
}

/* --- 导航链接样式 --- */
.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-links a {
  color: #ccc;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  position: relative;
  transition: color 0.3s;
  text-transform: uppercase;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #fff;
}

.nav-links .nav-btn {
  border: 1px solid var(--race-green);
  padding: 6px 16px;
  border-radius: 2px;
  color: var(--race-green) !important;
}

/* --- 移动端菜单图标 --- */
.mobile-menu-icon {
  display: none;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  z-index: 1001;
}

.mobile-menu-icon span {
  width: 25px;
  height: 2px;
  background: #fff;
  transition: 0.3s;
}

.mobile-menu-icon.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 6px);
}

.mobile-menu-icon.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-icon.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -6px);
}

/* --- 响应式 --- */
@media (max-width: 768px) {
  .mobile-menu-icon {
    display: flex;
  }

  .nav-links {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100vh;
    background: #0a0a0a;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 40px;
    transform: translateY(-100%);
    transition: transform 0.4s ease;
    opacity: 0;
  }

  .nav-links.mobile-visible {
    transform: translateY(0);
    opacity: 1;
  }

  .nav-links a {
    font-size: 1.5rem;
  }
}
</style>