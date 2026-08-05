import { createRouter, createWebHistory } from 'vue-router'
import { api, hasPasscode, setPasscode } from '../api/client'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/children', name: 'children', component: () => import('../views/ChildrenView.vue') },
    { path: '/children/:id', name: 'child-detail', component: () => import('../views/ChildDetailView.vue') },
    { path: '/course/:id', name: 'course-detail', component: () => import('../views/CourseDetailView.vue') },
    { path: '/record/add/:courseId', name: 'add-record', component: () => import('../views/AddRecordView.vue') },
    { path: '/organizations', name: 'organizations', component: () => import('../views/OrganizationsView.vue') },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'login') return
  const skip = localStorage.getItem('lesson-ledger-skip-auth')
  if (!hasPasscode() && !skip) {
    const key = new URLSearchParams(window.location.search).get('key')
    if (key) {
      try {
        await api.auth.login(key)
        setPasscode(key)
        localStorage.removeItem('lesson-ledger-skip-auth')
        return { path: to.path, query: {} }
      } catch {
        // 无效 key → 进入登录页
      }
    }
    return { name: 'login' }
  }
})

export default router
