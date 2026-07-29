<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { LESSON_STATUS_LABELS, type LessonStatus } from '../types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const course = computed(() => store.courses.find(c => c.id === route.params.courseId))
const stats = computed(() => store.getCourseStats(route.params.courseId as string))

const date = ref(new Date().toISOString().slice(0, 10))
const startTime = ref('')
const endTime = ref('')
const remark = ref('')
const showStatusPicker = ref(false)
const selectedStatus = ref<LessonStatus>('normal')

watch(course, (c) => {
  if (c) {
    startTime.value = c.defaultTimeStart ?? ''
    endTime.value = c.defaultTimeEnd ?? ''
  }
}, { immediate: true })

function addRecord(consume: number) {
  if (!course.value) return
  store.addLessonRecord({
    courseId: course.value.id,
    date: date.value,
    startTime: startTime.value || undefined,
    endTime: endTime.value || undefined,
    status: selectedStatus.value,
    consumeLessons: consume,
    remark: remark.value || undefined,
  })
  router.push(`/course/${course.value.id}`)
}

const consumePerSession = computed(() => course.value?.lessonsPerSession ?? 1)

const quickActions = computed(() => [
  { label: '正常上课', consume: consumePerSession.value, status: 'normal' as LessonStatus },
  { label: '请假', consume: 0, status: 'leave' as LessonStatus },
  { label: '补课', consume: consumePerSession.value, status: 'makeup' as LessonStatus },
  { label: '赠课', consume: -consumePerSession.value, status: 'adjust' as LessonStatus },
  { label: '调课', consume: 0, status: 'transfer' as LessonStatus },
  { label: '缺勤', consume: 0, status: 'absent' as LessonStatus },
  { label: '修正', consume: 0, status: 'adjust' as LessonStatus },
])
</script>

<template>
  <div>
    <div class="page-header">
      <h2>记一笔</h2>
    </div>

    <div v-if="course" class="card" style="margin-bottom:16px">
      <div style="font-size:14px;color:var(--gray-500)">{{ course.name }}</div>
      <div v-if="stats" style="display:flex;gap:16px;margin-top:8px;font-size:13px">
        <span>购买: {{ stats.totalBought }}</span>
        <span>已用: {{ stats.usedLessons }}</span>
        <span style="font-weight:600">剩余: {{ stats.remainingLessons }}</span>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>日期</label>
        <input v-model="date" type="date" />
      </div>
      <div class="form-group">
        <label>开始 - 结束</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input v-model="startTime" type="time" style="flex:1" />
          <span style="color:var(--gray-500)">~</span>
          <input v-model="endTime" type="time" style="flex:1" />
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>类型</label>
      <button
        class="btn btn-block"
        :style="{ background: 'var(--gray-100)', color: 'var(--gray-700)', textAlign: 'left', justifyContent: 'flex-start' }"
        @click="showStatusPicker = !showStatusPicker"
      >
        {{ LESSON_STATUS_LABELS[selectedStatus] }}
      </button>
      <div v-if="showStatusPicker" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
        <button
          v-for="(label, key) in LESSON_STATUS_LABELS"
          :key="key"
          class="btn btn-sm"
          :class="selectedStatus === key ? 'btn-primary' : 'btn-outline'"
          @click="selectedStatus = key as LessonStatus; showStatusPicker = false"
        >{{ label }}</button>
      </div>
    </div>

    <div class="form-group">
      <label>备注（选填）</label>
      <input v-model="remark" placeholder="如：第5节课" />
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px">
      <button
        v-for="action in quickActions"
        :key="action.label"
        class="btn"
        :class="action.consume > 0 ? 'btn-primary' : action.consume < 0 ? 'btn-danger' : 'btn-outline'"
        @click="selectedStatus = action.status; addRecord(action.consume)"
      >
        {{ action.label }}
        <span v-if="action.consume > 0" style="margin-left:4px;opacity:0.8">-{{ action.consume }}</span>
        <span v-else-if="action.consume < 0" style="margin-left:4px;opacity:0.8">+{{ Math.abs(action.consume) }}</span>
      </button>
    </div>

    <button class="btn btn-outline btn-block" style="margin-top:16px" @click="router.back()">取消</button>
  </div>
</template>
