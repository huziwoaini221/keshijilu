import type { AppData } from '../types'

export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `lesson-ledger-${new Date().toISOString().slice(0, 10)}.json`)
}

export function exportCSV(data: AppData, type: 'records' | 'purchases'): void {
  const rows = type === 'records' ? buildRecordsCSV(data) : buildPurchasesCSV(data)
  const bom = '\uFEFF'
  const content = bom + rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `lesson-ledger-${type}-${new Date().toISOString().slice(0, 10)}.csv`)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildRecordsCSV(data: AppData): string[][] {
  const courseMap = new Map(data.courses.map(c => [c.id, c]))
  const childMap = new Map(data.children.map(c => [c.id, c]))
  const headers = ['日期', '孩子', '课程', '类型', '消耗课时', '备注']
  const rows = data.lessonRecords.map(r => {
    const course = courseMap.get(r.courseId)
    const child = course ? childMap.get(course.childId) : undefined
    return [
      r.date,
      child?.name ?? '',
      course?.name ?? '',
      r.status,
      String(r.consumeLessons),
      r.remark ?? '',
    ]
  })
  rows.sort((a, b) => b[0].localeCompare(a[0]))
  return [headers, ...rows]
}

function buildPurchasesCSV(data: AppData): string[][] {
  const courseMap = new Map(data.courses.map(c => [c.id, c]))
  const childMap = new Map(data.children.map(c => [c.id, c]))
  const headers = ['日期', '孩子', '课程', '课时', '赠课', '金额', '付款方式', '备注']
  const rows = data.purchases.map(p => {
    const course = courseMap.get(p.courseId)
    const child = course ? childMap.get(course.childId) : undefined
    return [
      p.date,
      child?.name ?? '',
      course?.name ?? '',
      String(p.lessons),
      String(p.giftLessons),
      p.amount !== undefined ? String(p.amount) : '',
      p.paymentMethod ?? '',
      p.remark ?? '',
    ]
  })
  rows.sort((a, b) => b[0].localeCompare(a[0]))
  return [headers, ...rows]
}
