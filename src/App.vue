<script setup lang="ts">
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { clearPasscode } from './api/client'
import { hasPasscode } from './api/client'

const route = useRoute()
const router = useRouter()

function logout() {
  clearPasscode()
  localStorage.removeItem('lesson-ledger-skip-auth')
  localStorage.removeItem('lesson-ledger-family-id')
  router.push('/login')
}
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
      <button v-if="hasPasscode()" class="btn-logout" @click="logout">退出</button>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
