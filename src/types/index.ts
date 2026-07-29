export interface Child {
  id: string
  name: string
  birthday?: string
  avatar?: string
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  teacher?: string
  phone?: string
  address?: string
  createdAt: string
}

export interface Course {
  id: string
  childId: string
  organizationId?: string
  name: string
  lessonsPerSession: number
  defaultTimeStart?: string
  defaultTimeEnd?: string
  price?: number
  expireDate?: string
  alertThreshold: number
  createdAt: string
}

export interface CourseFormData {
  name: string
  lessonsPerSession: number
  defaultTimeStart?: string
  defaultTimeEnd?: string
  organizationId?: string
  expireDate?: string
  alertThreshold: number
}

export interface LessonRecord {
  id: string
  courseId: string
  date: string
  startTime?: string
  endTime?: string
  status: LessonStatus
  consumeLessons: number
  remark?: string
  createdAt: string
}

export interface Purchase {
  id: string
  courseId: string
  date: string
  lessons: number
  giftLessons: number
  amount?: number
  paymentMethod?: string
  remark?: string
  createdAt: string
}

export type LessonStatus = 'normal' | 'leave' | 'teacher_cancel' | 'makeup' | 'transfer' | 'absent' | 'refund' | 'adjust'

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  normal: '正常上课',
  leave: '请假',
  teacher_cancel: '老师取消',
  makeup: '补课',
  transfer: '调课',
  absent: '缺勤',
  refund: '退款',
  adjust: '修正',
}

export interface AppData {
  children: Child[]
  organizations: Organization[]
  courses: Course[]
  purchases: Purchase[]
  lessonRecords: LessonRecord[]
}

export interface CourseWithStats extends Course {
  childName: string
  orgName?: string
  usedLessons: number
  remainingLessons: number
  recentRecords: LessonRecord[]
}
