<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setPasscode } from '../api/client'
import { useAppStore } from '../stores/app'
const router = useRouter()
const store = useAppStore()
const code = ref('')
const error = ref('')
const loading = ref(false)
const showPwd = ref(false)

function skip() {
  localStorage.setItem('lesson-ledger-skip-auth', '1')
  router.push('/')
}

async function login() {
  if (!code.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    await api.auth.login(code.value.trim())
    setPasscode(code.value.trim())
    localStorage.removeItem('lesson-ledger-skip-auth')
    loading.value = false
    router.push('/')
    store.syncFromApi()
  } catch (e: any) {
    error.value = e.message || '登录失败'
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

    <div style="position:relative;margin-bottom:16px">
      <input
        v-model="code"
        :type="showPwd ? 'text' : 'password'"
        placeholder="输入密码"
        style="text-align:center;font-size:18px;letter-spacing:4px;width:100%"
        @keyup.enter="login"
      />
      <span
        style="position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:14px;color:var(--gray-500)"
        @click="showPwd = !showPwd"
      >{{ showPwd ? '隐藏' : '显示' }}</span>
    </div>

    <button class="btn btn-primary btn-block" :disabled="loading" @click="login">
      {{ loading ? '验证中...' : '进入' }}
    </button>

    <button
      class="btn btn-outline btn-block"
      style="margin-top:12px"
      @click="skip"
    >
      跳过，离线使用
    </button>
  </div>
</template>
