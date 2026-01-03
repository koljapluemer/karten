import { createRouter, createWebHistory } from 'vue-router'
import PracticePage from '@/pages/practice/PracticePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'practice',
      component: PracticePage
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/pages/stats/StatsPage.vue')
    }
  ]
})

export default router
