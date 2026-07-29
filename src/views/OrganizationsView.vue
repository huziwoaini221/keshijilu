<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', teacher: '', phone: '', address: '' })

function openAdd() {
  editingId.value = null
  form.value = { name: '', teacher: '', phone: '', address: '' }
  showModal.value = true
}

function openEdit(org: typeof store.organizations[0]) {
  editingId.value = org.id
  form.value = { name: org.name, teacher: org.teacher ?? '', phone: org.phone ?? '', address: org.address ?? '' }
  showModal.value = true
}

function save() {
  if (!form.value.name.trim()) return
  if (editingId.value) {
    store.updateOrganization(editingId.value, {
      name: form.value.name.trim(),
      teacher: form.value.teacher || undefined,
      phone: form.value.phone || undefined,
      address: form.value.address || undefined,
    })
  } else {
    store.addOrganization(form.value.name.trim(), {
      teacher: form.value.teacher || undefined,
      phone: form.value.phone || undefined,
      address: form.value.address || undefined,
    })
  }
  showModal.value = false
}

function remove(id: string) {
  if (confirm('确定删除此机构？')) store.deleteOrganization(id)
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>培训机构</h2>
      <button class="btn btn-sm btn-primary" @click="openAdd">添加机构</button>
    </div>

    <div v-if="store.organizations.length === 0" class="empty-state">
      <p>还没有培训机构</p>
    </div>

    <div v-for="org in store.organizations" :key="org.id" class="card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600">{{ org.name }}</div>
          <div v-if="org.teacher || org.phone" style="font-size:12px;color:var(--gray-500);margin-top:2px">
            {{ org.teacher }}{{ org.teacher && org.phone ? ' · ' : '' }}{{ org.phone }}
          </div>
          <div v-if="org.address" style="font-size:12px;color:var(--gray-500)">{{ org.address }}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-outline" @click="openEdit(org)">编辑</button>
          <button class="btn btn-sm btn-danger" @click="remove(org.id)">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑机构' : '添加机构' }}</h3>
          <button class="modal-close" @click="showModal=false">&times;</button>
        </div>
        <div class="form-group">
          <label>机构名称</label>
          <input v-model="form.name" placeholder="如：小天使钢琴" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>老师（选填）</label>
            <input v-model="form.teacher" placeholder="老师姓名" />
          </div>
          <div class="form-group">
            <label>电话（选填）</label>
            <input v-model="form.phone" placeholder="手机号" />
          </div>
        </div>
        <div class="form-group">
          <label>地址（选填）</label>
          <input v-model="form.address" placeholder="机构地址" />
        </div>
        <button class="btn btn-primary btn-block" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>
