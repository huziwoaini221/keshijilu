import { createRouter, createWebHistory } from 'vue-router'
import { hasPasscode } from '../api/client'

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

router.beforeEach((to) => {
  if (to.name === 'login') return
  const skip = localStorage.getItem('lesson-ledger-skip-auth')
  if (!hasPasscode() && !skip) {
    return { name: 'login' }
  }
})

export default router
