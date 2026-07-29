<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const store = useAppStore()

const child = computed(() => store.children.find(c => c.id === route.params.id))
const courses = computed(() => store.coursesWithStats.filter(c => c.childId === route.params.id))

const showModal = ref(false)
const editingCourseId = ref<string | null>(null)
const editingCourse = ref({
  name: '', lessonsPerSession: 1, defaultTimeStart: '', defaultTimeEnd: '', expireDate: '', alertThreshold: 10, organizationId: '',
})

const modalTitle = computed(() => editingCourseId.value ? '编辑课程' : '添加课程')

function openAddCourse() {
  editingCourseId.value = null
  editingCourse.value = { name: '', lessonsPerSession: 1, defaultTimeStart: '', defaultTimeEnd: '', expireDate: '', alertThreshold: 10, organizationId: '' }
  showModal.value = true
}

function openEditCourse(course: typeof store.courses[0]) {
  editingCourseId.value = course.id
  editingCourse.value = {
    name: course.name,
    lessonsPerSession: course.lessonsPerSession,
    defaultTimeStart: course.defaultTimeStart ?? '',
    defaultTimeEnd: course.defaultTimeEnd ?? '',
    expireDate: course.expireDate ?? '',
    alertThreshold: course.alertThreshold,
    organizationId: course.organizationId ?? '',
  }
  showModal.value = true
}

function saveCourse() {
  if (!editingCourse.value.name.trim() || !editingCourse.value.lessonsPerSession) return
  if (editingCourseId.value) {
    store.updateCourse(editingCourseId.value, {
      name: editingCourse.value.name.trim(),
      lessonsPerSession: editingCourse.value.lessonsPerSession,
      defaultTimeStart: editingCourse.value.defaultTimeStart || undefined,
      defaultTimeEnd: editingCourse.value.defaultTimeEnd || undefined,
      organizationId: editingCourse.value.organizationId || undefined,
      expireDate: editingCourse.value.expireDate || undefined,
      alertThreshold: editingCourse.value.alertThreshold,
    })
  } else {
    store.addCourse({
      childId: route.params.id as string,
      name: editingCourse.value.name.trim(),
      lessonsPerSession: editingCourse.value.lessonsPerSession,
      defaultTimeStart: editingCourse.value.defaultTimeStart || undefined,
      defaultTimeEnd: editingCourse.value.defaultTimeEnd || undefined,
      organizationId: editingCourse.value.organizationId || undefined,
      expireDate: editingCourse.value.expireDate || undefined,
      alertThreshold: editingCourse.value.alertThreshold,
    })
  }
  showModal.value = false
}

function removeCourse(id: string) {
  if (confirm('删除课程将同时删除所有购买记录和流水，确定？')) {
    store.deleteCourse(id)
  }
}
</script>

<template>
  <div v-if="child">
    <div class="page-header">
      <h2>{{ child.name }}</h2>
      <button class="btn btn-sm btn-primary" @click="openAddCourse">添加课程</button>
    </div>

    <div v-if="courses.length === 0" class="empty-state">
      <p>还没有课程，添加一门吧</p>
    </div>

    <div v-for="course in courses" :key="course.id" class="card">
      <RouterLink :to="`/course/${course.id}`" style="text-decoration:none;color:inherit">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600">{{ course.name }}</div>
            <div v-if="course.orgName" style="font-size:12px;color:var(--gray-500)">{{ course.orgName }}</div>
          </div>
          <div style="text-align:right">
            <div :class="['tag', course.remainingLessons <= course.alertThreshold && course.remainingLessons > 0 ? 'tag-yellow' : 'tag-green']">
              剩余 {{ course.remainingLessons }}
            </div>
          </div>
        </div>
      </RouterLink>
      <div style="display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--gray-100)">
        <button class="btn btn-sm btn-outline" @click="openEditCourse(course)">编辑</button>
        <button class="btn btn-sm btn-outline" @click="removeCourse(course.id)">删除</button>
      </div>
    </div>

    <!-- Course Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="showModal=false">&times;</button>
        </div>
        <div class="form-group">
          <label>课程名称</label>
          <input v-model="editingCourse.name" placeholder="如：钢琴" />
        </div>
        <div class="form-group">
          <label>培训机构（选填）</label>
          <select v-model="editingCourse.organizationId">
            <option value="">无</option>
            <option v-for="org in store.organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>每节课消耗课时</label>
            <input v-model.number="editingCourse.lessonsPerSession" type="number" min="1" />
          </div>
          <div class="form-group">
            <label>开始时间（选填）</label>
            <input v-model="editingCourse.defaultTimeStart" type="time" />
          </div>
          <div class="form-group">
            <label>结束时间（选填）</label>
            <input v-model="editingCourse.defaultTimeEnd" type="time" />
          </div>
        </div>
        <div class="form-group">
          <label>预警阈值</label>
          <input v-model.number="editingCourse.alertThreshold" type="number" min="1" value="10" />
        </div>
        <div class="form-group">
          <label>有效期至（选填）</label>
          <input v-model="editingCourse.expireDate" type="date" />
        </div>
        <button class="btn btn-primary btn-block" @click="saveCourse">保存</button>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <p>孩子不存在</p>
    <RouterLink to="/children" class="btn btn-outline btn-sm" style="margin-top:12px">返回</RouterLink>
  </div>
</template>
