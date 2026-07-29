<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { RouterLink } from 'vue-router'

const store = useAppStore()
const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', birthday: '' })

function openAdd() {
  editingId.value = null
  form.value = { name: '', birthday: '' }
  showModal.value = true
}

function openEdit(child: typeof store.children[0]) {
  editingId.value = child.id
  form.value = { name: child.name, birthday: child.birthday ?? '' }
  showModal.value = true
}

function save() {
  if (!form.value.name.trim()) return
  if (editingId.value) {
    store.updateChild(editingId.value, { name: form.value.name.trim(), birthday: form.value.birthday || undefined })
  } else {
    store.addChild(form.value.name.trim(), form.value.birthday || undefined)
  }
  showModal.value = false
}

function remove(id: string) {
  if (confirm('删除孩子将同时删除所有相关课程和记录，确定？')) {
    store.deleteChild(id)
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>孩子</h2>
      <button class="btn btn-sm btn-primary" @click="openAdd">添加孩子</button>
    </div>

    <div v-if="store.children.length === 0" class="empty-state">
      <p>还没有添加孩子</p>
    </div>

    <div v-for="child in store.children" :key="child.id" class="card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <RouterLink :to="`/children/${child.id}`" style="font-weight:600;font-size:16px;text-decoration:none;color:inherit">
            {{ child.name }}
          </RouterLink>
          <div v-if="child.birthday" style="font-size:12px;color:var(--gray-500)">生日: {{ child.birthday }}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-outline" @click="openEdit(child)">编辑</button>
          <button class="btn btn-sm btn-danger" @click="remove(child.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑孩子' : '添加孩子' }}</h3>
          <button class="modal-close" @click="showModal=false">&times;</button>
        </div>
        <div class="form-group">
          <label>姓名</label>
          <input v-model="form.name" placeholder="输入孩子姓名" @keyup.enter="save" />
        </div>
        <div class="form-group">
          <label>生日（选填）</label>
          <input v-model="form.birthday" type="date" />
        </div>
        <button class="btn btn-primary btn-block" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>
