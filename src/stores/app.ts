import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppData, Child, Organization, Course, Purchase, LessonRecord, CourseWithStats } from '../types'
import { generateId } from '../utils/id'
import { loadData, saveData } from '../utils/storage'
import { hasPasscode } from '../api/client'
import { api } from '../api/client'

export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(loadData())
  const familyId = ref(localStorage.getItem('lesson-ledger-family-id') || '')

  const online = computed(() => hasPasscode() && !!familyId.value)

  function persist() {
    if (!online.value) saveData(data.value)
  }

  async function ensureFamily() {
    if (familyId.value) return
    const families = await api.families.list()
    if (families.length > 0) {
      familyId.value = families[0].id
    } else {
      const newId = generateId()
      await api.families.create({ id: newId, name: '我的家庭' })
      familyId.value = newId
    }
    localStorage.setItem('lesson-ledger-family-id', familyId.value)
  }

  async function syncFromApi() {
    await ensureFamily()
    const result = await api.sync.get(familyId.value)
    data.value = {
      children: result.children.map((c: any) => ({ ...c, birthday: c.birthday ?? undefined, avatar: c.avatar ?? undefined })),
      organizations: result.organizations.map((o: any) => ({ ...o, teacher: o.teacher ?? undefined, phone: o.phone ?? undefined, address: o.address ?? undefined })),
      courses: result.courses.map((c: any) => ({
        ...c,
        lessonsPerSession: c.lessons_per_session,
        defaultTimeStart: c.default_time_start ?? undefined,
        defaultTimeEnd: c.default_time_end ?? undefined,
        organizationId: c.organization_id ?? undefined,
        childId: c.child_id,
        expireDate: c.expire_date ?? undefined,
        alertThreshold: c.alert_threshold,
      })),
      purchases: result.purchases.map((p: any) => ({
        ...p,
        courseId: p.course_id,
        giftLessons: p.gift_lessons,
        paymentMethod: p.payment_method ?? undefined,
      })),
      lessonRecords: result.lessonRecords.map((r: any) => ({
        ...r,
        courseId: r.course_id,
        startTime: r.start_time ?? undefined,
        endTime: r.end_time ?? undefined,
        consumeLessons: r.consume_lessons,
      })),
    }
  }

  // ── Children ──────────────────────────────────────────
  function addChild(name: string, birthday?: string): Child {
    const child: Child = { id: generateId(), name, birthday, createdAt: new Date().toISOString() }
    data.value.children.push(child)
    persist()
    if (online.value) {
      api.children.create({ id: child.id, family_id: familyId.value, name, birthday, created_at: child.createdAt }).catch(console.error)
    }
    return child
  }

  function updateChild(id: string, fields: Partial<Child>) {
    const idx = data.value.children.findIndex(c => c.id === id)
    if (idx !== -1) {
      Object.assign(data.value.children[idx], fields)
      persist()
      if (online.value) api.children.update(id, fields).catch(console.error)
    }
  }

  function deleteChild(id: string) {
    data.value.children = data.value.children.filter(c => c.id !== id)
    data.value.courses = data.value.courses.filter(c => c.childId !== id)
    persist()
    if (online.value) api.children.delete(id).catch(console.error)
  }

  // ── Organizations ─────────────────────────────────────
  function addOrganization(name: string, opts?: Partial<Organization>): Organization {
    const org: Organization = { id: generateId(), name, ...opts, createdAt: new Date().toISOString() }
    data.value.organizations.push(org)
    persist()
    if (online.value) {
      api.organizations.create({ id: org.id, family_id: familyId.value, name, ...opts, created_at: org.createdAt }).catch(console.error)
    }
    return org
  }

  function updateOrganization(id: string, fields: Partial<Organization>) {
    const idx = data.value.organizations.findIndex(o => o.id === id)
    if (idx !== -1) {
      Object.assign(data.value.organizations[idx], fields)
      persist()
      if (online.value) api.organizations.update(id, fields).catch(console.error)
    }
  }

  function deleteOrganization(id: string) {
    data.value.organizations = data.value.organizations.filter(o => o.id !== id)
    persist()
    if (online.value) api.organizations.delete(id).catch(console.error)
  }

  // ── Courses ───────────────────────────────────────────
  function addCourse(course: Omit<Course, 'id' | 'createdAt'>): Course {
    const c: Course = { ...course, id: generateId(), createdAt: new Date().toISOString() }
    data.value.courses.push(c)
    persist()
    if (online.value) {
      api.courses.create({
        id: c.id, family_id: familyId.value, child_id: c.childId,
        organization_id: c.organizationId, name: c.name,
        lessons_per_session: c.lessonsPerSession,
        default_time_start: c.defaultTimeStart, default_time_end: c.defaultTimeEnd,
        price: c.price, expire_date: c.expireDate, alert_threshold: c.alertThreshold,
        created_at: c.createdAt,
      }).catch(console.error)
    }
    return c
  }

  function updateCourse(id: string, fields: Partial<Course>) {
    const idx = data.value.courses.findIndex(c => c.id === id)
    if (idx !== -1) {
      Object.assign(data.value.courses[idx], fields)
      persist()
      if (online.value) api.courses.update(id, fields).catch(console.error)
    }
  }

  function deleteCourse(id: string) {
    data.value.courses = data.value.courses.filter(c => c.id !== id)
    data.value.purchases = data.value.purchases.filter(p => p.courseId !== id)
    data.value.lessonRecords = data.value.lessonRecords.filter(r => r.courseId !== id)
    persist()
    if (online.value) api.courses.delete(id).catch(console.error)
  }

  // ── Purchases ─────────────────────────────────────────
  function addPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Purchase {
    const p: Purchase = { ...purchase, id: generateId(), createdAt: new Date().toISOString() }
    data.value.purchases.push(p)
    persist()
    if (online.value) {
      api.purchases.create({
        id: p.id, family_id: familyId.value, course_id: p.courseId,
        date: p.date, lessons: p.lessons, gift_lessons: p.giftLessons,
        amount: p.amount, payment_method: p.paymentMethod, remark: p.remark,
        created_at: p.createdAt,
      }).catch(console.error)
    }
    return p
  }

  function updatePurchase(id: string, fields: Partial<Omit<Purchase, 'id' | 'courseId' | 'createdAt'>>) {
    const idx = data.value.purchases.findIndex(p => p.id === id)
    if (idx !== -1) {
      Object.assign(data.value.purchases[idx], fields)
      persist()
      if (online.value) api.purchases.update(id, fields).catch(console.error)
    }
  }

  function deletePurchase(id: string) {
    data.value.purchases = data.value.purchases.filter(p => p.id !== id)
    persist()
    if (online.value) api.purchases.delete(id).catch(console.error)
  }

  // ── Lesson Records ────────────────────────────────────
  function addLessonRecord(record: Omit<LessonRecord, 'id' | 'createdAt'>): LessonRecord {
    const r: LessonRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() }
    data.value.lessonRecords.push(r)
    persist()
    if (online.value) {
      api.records.create({
        id: r.id, family_id: familyId.value, course_id: r.courseId,
        date: r.date, start_time: r.startTime, end_time: r.endTime,
        status: r.status, consume_lessons: r.consumeLessons, remark: r.remark,
        created_at: r.createdAt,
      }).catch(console.error)
    }
    return r
  }

  function deleteLessonRecord(id: string) {
    data.value.lessonRecords = data.value.lessonRecords.filter(r => r.id !== id)
    persist()
    if (online.value) api.records.delete(id).catch(console.error)
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
    online,
    familyId,
    children: computed(() => data.value.children),
    organizations: computed(() => data.value.organizations),
    courses: computed(() => data.value.courses),
    purchases: computed(() => data.value.purchases),
    lessonRecords: computed(() => data.value.lessonRecords),
    coursesWithStats,
    ensureFamily,
    syncFromApi,
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
