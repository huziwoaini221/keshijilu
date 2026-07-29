<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <RouterLink to="/" class="logo">课时账本</RouterLink>
      </div>
      <nav class="header-nav">
        <RouterLink to="/" :class="{ active: route.path === '/' }">首页</RouterLink>
        <RouterLink to="/children" :class="{ active: route.path.startsWith('/children') }">孩子</RouterLink>
        <RouterLink to="/organizations" :class="{ active: route.path.startsWith('/organizations') }">机构</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
