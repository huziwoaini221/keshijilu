<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'
import { LESSON_STATUS_LABELS } from '../types'
import { exportJSON, exportCSV } from '../utils/export'

const route = useRoute()
const store = useAppStore()

const course = computed(() => store.coursesWithStats.find(c => c.id === route.params.id))
const stats = computed(() => store.getCourseStats(route.params.id as string))
const purchases = computed(() => store.purchases.filter(p => p.courseId === route.params.id).sort((a, b) => b.date.localeCompare(a.date)))
const records = computed(() => store.lessonRecords.filter(r => r.courseId === route.params.id).sort((a, b) => b.date.localeCompare(a.date)))

const tab = ref<'records' | 'purchases'>('records')
const showPurchaseModal = ref(false)
const purchaseEditingId = ref<string | null>(null)
const purchaseForm = ref({ date: '', lessons: 1, giftLessons: 0, amount: undefined as number | undefined, paymentMethod: '', remark: '' })

const purchaseModalTitle = computed(() => purchaseEditingId.value ? '编辑购买记录' : '添加购买记录')

function openAddPurchase() {
  purchaseEditingId.value = null
  purchaseForm.value = { date: new Date().toISOString().slice(0, 10), lessons: 1, giftLessons: 0, amount: undefined, paymentMethod: '', remark: '' }
  showPurchaseModal.value = true
}

function openEditPurchase(p: typeof store.purchases[0]) {
  purchaseEditingId.value = p.id
  purchaseForm.value = {
    date: p.date,
    lessons: p.lessons,
    giftLessons: p.giftLessons,
    amount: p.amount,
    paymentMethod: p.paymentMethod ?? '',
    remark: p.remark ?? '',
  }
  showPurchaseModal.value = true
}

function savePurchase() {
  if (!purchaseForm.value.date || !purchaseForm.value.lessons) return
  if (purchaseEditingId.value) {
    store.updatePurchase(purchaseEditingId.value, {
      date: purchaseForm.value.date,
      lessons: purchaseForm.value.lessons,
      giftLessons: purchaseForm.value.giftLessons || 0,
      amount: purchaseForm.value.amount,
      paymentMethod: purchaseForm.value.paymentMethod || undefined,
      remark: purchaseForm.value.remark || undefined,
    })
  } else {
    store.addPurchase({
      courseId: route.params.id as string,
      date: purchaseForm.value.date,
      lessons: purchaseForm.value.lessons,
      giftLessons: purchaseForm.value.giftLessons || 0,
      amount: purchaseForm.value.amount,
      paymentMethod: purchaseForm.value.paymentMethod || undefined,
      remark: purchaseForm.value.remark || undefined,
    })
  }
  showPurchaseModal.value = false
}

function deleteRecord(id: string) {
  if (confirm('确定删除这条记录？')) store.deleteLessonRecord(id)
}

function deletePurchase(id: string) {
  if (confirm('确定删除这条购买记录？')) store.deletePurchase(id)
}

function statusTagClass(status: string) {
  if (status === 'normal' || status === 'makeup') return 'tag-green'
  if (status === 'leave' || status === 'teacher_cancel') return 'tag-yellow'
  if (status === 'refund') return 'tag-red'
  return 'tag-blue'
}
</script>

<template>
  <div v-if="course && stats">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>{{ course.name }}</h2>
        <div style="font-size:13px;color:var(--gray-500)">
          {{ course.childName }}
          <span v-if="course.orgName"> · {{ course.orgName }}</span>
          <span v-if="course.defaultTimeStart">{{ course.defaultTimeStart }}-{{ course.defaultTimeEnd ?? '' }}</span>
        </div>
      </div>
      <RouterLink :to="`/record/add/${course.id}`" class="btn btn-sm btn-primary">记一笔</RouterLink>
    </div>

    <!-- Stats Cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:12px;color:var(--gray-500)">购买</div>
        <div style="font-size:24px;font-weight:700">{{ stats.totalBought }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:12px;color:var(--gray-500)">已用</div>
        <div style="font-size:24px;font-weight:700;color:var(--primary)">{{ stats.usedLessons }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:12px;color:var(--gray-500)">剩余</div>
        <div :style="{ fontSize: '24px', fontWeight: 700, color: stats.remainingLessons <= course.alertThreshold ? 'var(--warning)' : 'var(--success)' }">
          {{ stats.remainingLessons }}
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:0;margin-bottom:12px;border-bottom:2px solid var(--gray-200)">
      <button
        :style="{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === 'records' ? 700 : 400, borderBottom: tab === 'records' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px', color: tab === 'records' ? 'var(--primary)' : 'var(--gray-500)' }"
        @click="tab='records'"
      >流水</button>
      <button
        :style="{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === 'purchases' ? 700 : 400, borderBottom: tab === 'purchases' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px', color: tab === 'purchases' ? 'var(--primary)' : 'var(--gray-500)' }"
        @click="tab='purchases'"
      >购买记录</button>
    </div>

    <!-- Records Tab -->
    <div v-if="tab === 'records'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:14px;font-weight:600">课时流水</span>
        <button class="btn btn-sm btn-outline" @click="exportCSV(store.data, 'records')">导出CSV</button>
      </div>
      <div v-if="records.length === 0" class="empty-state">
        <p>暂无记录</p>
        <RouterLink :to="`/record/add/${course.id}`" class="btn btn-primary btn-sm" style="margin-top:8px">记第一笔</RouterLink>
      </div>
      <div v-for="r in records" :key="r.id" class="card" style="padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <span :class="['tag', statusTagClass(r.status)]">{{ LESSON_STATUS_LABELS[r.status] }}</span>
            <span v-if="r.remark" style="font-size:12px;color:var(--gray-500)">{{ r.remark }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="{ fontWeight: 600, color: r.consumeLessons > 0 ? 'var(--danger)' : r.consumeLessons < 0 ? 'var(--success)' : 'inherit' }">
              {{ r.consumeLessons > 0 ? '-' : r.consumeLessons < 0 ? '+' : '' }}{{ Math.abs(r.consumeLessons) }}
            </span>
            <button class="btn btn-sm btn-outline" style="padding:2px 6px;font-size:11px" @click="deleteRecord(r.id)">删</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--gray-500);margin-top:4px">{{ r.date }}<span v-if="r.startTime"> {{ r.startTime }}-{{ r.endTime ?? '' }}</span></div>
      </div>
    </div>

    <!-- Purchases Tab -->
    <div v-if="tab === 'purchases'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:14px;font-weight:600">购买记录</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-outline" @click="exportCSV(store.data, 'purchases')">导出CSV</button>
          <button class="btn btn-sm btn-primary" @click="openAddPurchase">添加</button>
        </div>
      </div>
      <div v-if="purchases.length === 0" class="empty-state">
        <p>暂无购买记录</p>
      </div>
      <div v-for="p in purchases" :key="p.id" class="card" style="padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div>
              <span class="tag tag-green">购买</span>
              <span style="font-weight:600;margin-left:6px">{{ p.lessons }} 节</span>
              <span v-if="p.giftLessons" class="tag tag-yellow" style="margin-left:4px">赠 {{ p.giftLessons }}</span>
            </div>
            <div v-if="p.amount" style="font-size:12px;color:var(--gray-500);margin-top:2px">¥{{ p.amount }}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="text-align:right">
              <div style="font-size:12px;color:var(--gray-500)">{{ p.date }}</div>
              <div v-if="p.remark" style="font-size:11px;color:var(--gray-500)">{{ p.remark }}</div>
            </div>
            <button class="btn btn-sm btn-outline" style="padding:2px 6px;font-size:11px" @click="openEditPurchase(p)">编</button>
            <button class="btn btn-sm btn-outline" style="padding:2px 6px;font-size:11px" @click="deletePurchase(p.id)">删</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Export All -->
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-sm btn-outline btn-block" @click="exportJSON(store.data)">导出全部 JSON</button>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="showPurchaseModal=false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ purchaseModalTitle }}</h3>
          <button class="modal-close" @click="showPurchaseModal=false">&times;</button>
        </div>
        <div class="form-group">
          <label>购买日期</label>
          <input v-model="purchaseForm.date" type="date" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>课时数</label>
            <input v-model.number="purchaseForm.lessons" type="number" min="1" />
          </div>
          <div class="form-group">
            <label>赠课数</label>
            <input v-model.number="purchaseForm.giftLessons" type="number" min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>金额（选填）</label>
            <input v-model.number="purchaseForm.amount" type="number" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>付款方式（选填）</label>
            <input v-model="purchaseForm.paymentMethod" placeholder="微信 / 支付宝" />
          </div>
        </div>
        <div class="form-group">
          <label>备注（选填）</label>
          <input v-model="purchaseForm.remark" />
        </div>
        <button class="btn btn-primary btn-block" @click="savePurchase">保存</button>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <p>课程不存在</p>
    <RouterLink to="/" class="btn btn-outline btn-sm" style="margin-top:12px">返回首页</RouterLink>
  </div>
</template>
