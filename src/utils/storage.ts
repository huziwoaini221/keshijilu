import type { AppData } from '../types'

const STORAGE_KEY = 'lesson-ledger-data'

const defaultData: AppData = {
  children: [],
  organizations: [],
  courses: [],
  purchases: [],
  lessonRecords: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultData }
    return JSON.parse(raw) as AppData
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
