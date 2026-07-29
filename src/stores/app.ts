import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppData, Child, Organization, Course, Purchase, LessonRecord, CourseWithStats } from '../types'
import { generateId } from '../utils/id'
import { loadData, saveData } from '../utils/storage'

export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(loadData())

  function persist() {
    saveData(data.value)
  }

  // ── Children ──────────────────────────────────────────
  function addChild(name: string, birthday?: string): Child {
    const child: Child = { id: generateId(), name, birthday, createdAt: new Date().toISOString() }
    data.value.children.push(child)
    persist()
    return child
  }

  function updateChild(id: string, fields: Partial<Child>) {
    const idx = data.value.children.findIndex(c => c.id === id)
    if (idx !== -1) {
      Object.assign(data.value.children[idx], fields)
      persist()
    }
  }

  function deleteChild(id: string) {
    data.value.children = data.value.children.filter(c => c.id !== id)
    data.value.courses = data.value.courses.filter(c => c.childId !== id)
    persist()
  }

  // ── Organizations ─────────────────────────────────────
  function addOrganization(name: string, opts?: Partial<Organization>): Organization {
    const org: Organization = { id: generateId(), name, ...opts, createdAt: new Date().toISOString() }
    data.value.organizations.push(org)
    persist()
    return org
  }

  function updateOrganization(id: string, fields: Partial<Organization>) {
    const idx = data.value.organizations.findIndex(o => o.id === id)
    if (idx !== -1) {
      Object.assign(data.value.organizations[idx], fields)
      persist()
    }
  }

  function deleteOrganization(id: string) {
    data.value.organizations = data.value.organizations.filter(o => o.id !== id)
    persist()
  }

  // ── Courses ───────────────────────────────────────────
  function addCourse(course: Omit<Course, 'id' | 'createdAt'>): Course {
    const c: Course = { ...course, id: generateId(), createdAt: new Date().toISOString() }
    data.value.courses.push(c)
    persist()
    return c
  }

  function updateCourse(id: string, fields: Partial<Course>) {
    const idx = data.value.courses.findIndex(c => c.id === id)
    if (idx !== -1) {
      Object.assign(data.value.courses[idx], fields)
      persist()
    }
  }

  function deleteCourse(id: string) {
    data.value.courses = data.value.courses.filter(c => c.id !== id)
    data.value.purchases = data.value.purchases.filter(p => p.courseId !== id)
    data.value.lessonRecords = data.value.lessonRecords.filter(r => r.courseId !== id)
    persist()
  }

  // ── Purchases ─────────────────────────────────────────
  function addPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Purchase {
    const p: Purchase = { ...purchase, id: generateId(), createdAt: new Date().toISOString() }
    data.value.purchases.push(p)
    persist()
    return p
  }

  function updatePurchase(id: string, fields: Partial<Omit<Purchase, 'id' | 'courseId' | 'createdAt'>>) {
    const idx = data.value.purchases.findIndex(p => p.id === id)
    if (idx !== -1) {
      Object.assign(data.value.purchases[idx], fields)
      persist()
    }
  }

  function deletePurchase(id: string) {
    data.value.purchases = data.value.purchases.filter(p => p.id !== id)
    persist()
  }

  // ── Lesson Records ────────────────────────────────────
  function addLessonRecord(record: Omit<LessonRecord, 'id' | 'createdAt'>): LessonRecord {
    const r: LessonRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
    data.value.lessonRecords.push(r)
    persist()
    return r
  }

  function deleteLessonRecord(id: string) {
    data.value.lessonRecords = data.value.lessonRecords.filter(r => r.id !== id)
    persist()
  }

  // ── Computed ──────────────────────────────────────────
  const childMap = computed(() => new Map(data.value.children.map(c => [c.id, c.name])))
  const orgMap = computed(() => new Map(data.value.organizations.map(o => [o.id, o.name])))

  function getCourseStats(courseId: string) {
    const course = data.value.courses.find(c => c.id === courseId)
    if (!course) return null

    const purchases = data.value.purchases.filter(p => p.courseId === courseId)
    const records = data.value.lessonRecords.filter(r => r.courseId === courseId)

    const totalBought = purchases.reduce((sum, p) => sum + p.lessons + p.giftLessons, 0)
    const used = records.reduce((sum, r) => sum + Math.max(0, r.consumeLessons), 0)
    const remaining = totalBought - used

    const recentRecords = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

    return {
      totalBought,
      usedLessons: used,
      remainingLessons: remaining,
      recentRecords,
    }
  }

  const coursesWithStats = computed<CourseWithStats[]>(() => {
    return data.value.courses.map(c => {
      const stats = getCourseStats(c.id)
      return {
        ...c,
        childName: childMap.value.get(c.childId) ?? '未知',
        orgName: c.organizationId ? orgMap.value.get(c.organizationId) : undefined,
        usedLessons: stats?.usedLessons ?? 0,
        remainingLessons: stats?.remainingLessons ?? 0,
        recentRecords: stats?.recentRecords ?? [],
      }
    })
  })

  function getAlertCourses(): CourseWithStats[] {
    return coursesWithStats.value.filter(
      c => c.remainingLessons <= c.alertThreshold && c.remainingLessons > 0
    )
  }

  return {
    data,
    children: computed(() => data.value.children),
    organizations: computed(() => data.value.organizations),
    courses: computed(() => data.value.courses),
    purchases: computed(() => data.value.purchases),
    lessonRecords: computed(() => data.value.lessonRecords),
    coursesWithStats,
    addChild,
    updateChild,
    deleteChild,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    addCourse,
    updateCourse,
    deleteCourse,
    addPurchase,
    updatePurchase,
    deletePurchase,
    addLessonRecord,
    deleteLessonRecord,
    getCourseStats,
    getAlertCourses,
    childMap,
    orgMap,
  }
})
