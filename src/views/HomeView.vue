<script setup lang="ts">
import { useAppStore } from '../stores/app'
import { RouterLink } from 'vue-router'

const store = useAppStore()
const alertCourses = store.getAlertCourses
</script>

<template>
  <div>
    <div class="page-header">
      <h2>首页</h2>
      <div style="display:flex;gap:8px">
        <RouterLink to="/children" class="btn btn-sm btn-outline">管理</RouterLink>
      </div>
    </div>

    <div v-if="alertCourses.length" class="alert alert-warning">
      ⚠️ {{ alertCourses.length }} 门课程即将耗尽
    </div>

    <div v-if="store.children.length === 0" class="empty-state">
      <p style="font-size:40px;margin-bottom:8px">📒</p>
      <p>还没有孩子，先添加孩子和课程吧</p>
      <RouterLink to="/children" class="btn btn-primary btn-block" style="margin-top:16px">添加孩子</RouterLink>
    </div>

    <div v-for="child in store.children" :key="child.id" class="child-section" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:18px">👤</span>
        <span style="font-weight:600;font-size:16px">{{ child.name }}</span>
        <RouterLink :to="`/children/${child.id}`" style="margin-left:auto;font-size:13px;color:var(--primary)">详情</RouterLink>
      </div>

      <div v-if="store.courses.filter(c => c.childId === child.id).length === 0" style="font-size:14px;color:var(--gray-500);padding:12px;text-align:center">
        暂无课程
      </div>

      <div
        v-for="course in store.coursesWithStats.filter(c => c.childId === child.id)"
        :key="course.id"
        class="card"
        style="cursor:pointer"
        @click="$router.push(`/course/${course.id}`)"
      >
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600">{{ course.name }}</div>
            <div v-if="course.orgName" style="font-size:12px;color:var(--gray-500)">{{ course.orgName }}</div>
          </div>
          <div style="text-align:right">
            <div :class="['tag', course.remainingLessons <= course.alertThreshold && course.remainingLessons > 0 ? 'tag-yellow' : 'tag-green']" style="font-size:16px;font-weight:700">
              剩余 {{ course.remainingLessons }} 节
            </div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:4px">
              已用 {{ course.usedLessons }} 节
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
