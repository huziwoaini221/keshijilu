<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setPasscode } from '../api/client'
const router = useRouter()
const code = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  if (!code.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    await api.auth.login(code.value.trim())
    setPasscode(code.value.trim())
    router.push('/')
  } catch {
    error.value = '密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding:60px 24px;text-align:center">
    <div style="font-size:48px;margin-bottom:16px">📒</div>
    <h1 style="font-size:24px;font-weight:700;margin-bottom:4px">课时账本</h1>
    <p style="font-size:14px;color:var(--gray-500);margin-bottom:32px">输入密码开始使用</p>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <input
      v-model="code"
      type="password"
      placeholder="输入密码"
      style="text-align:center;font-size:18px;letter-spacing:4px;margin-bottom:16px"
      @keyup.enter="login"
    />

    <button class="btn btn-primary btn-block" :disabled="loading" @click="login">
      {{ loading ? '验证中...' : '进入' }}
    </button>

    <button
      class="btn btn-outline btn-block"
      style="margin-top:12px"
      @click="router.push('/')"
    >
      跳过，离线使用
    </button>
  </div>
</template>
