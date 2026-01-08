<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="app-layout">
    <NavBar />

    <main class="main-content">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<style>
/* 1. 确保 html/body 占满高度 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #0a0a0a;
  /* 防止背景闪白 */
  font-family: 'Inter', sans-serif;
}

/* 2. Flex 垂直布局，把 Footer 挤到底部 */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* 最小高度为屏幕高度 */
}

/* 3. 内容区域占据剩余空间 */
.main-content {
  flex: 1;
  position: relative;
  /* 建立定位基准 */
  width: 100%;
  box-sizing: border-box;
  /* 这一点很重要 */
}
</style>