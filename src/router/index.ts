import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/children', name: 'children', component: () => import('../views/ChildrenView.vue') },
    { path: '/children/:id', name: 'child-detail', component: () => import('../views/ChildDetailView.vue') },
    { path: '/course/:id', name: 'course-detail', component: () => import('../views/CourseDetailView.vue') },
    { path: '/record/add/:courseId', name: 'add-record', component: () => import('../views/AddRecordView.vue') },
    { path: '/organizations', name: 'organizations', component: () => import('../views/OrganizationsView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  ],
})

export default router
