import { createRouter, createWebHistory } from 'vue-router'
import PracticePage from '@/pages/practice/PracticePage.vue'
import LearningGoalsPage from '@/pages/learning-goals/LearningGoalsPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'practice',
      component: PracticePage
    },
    {
      path: '/goals',
      name: 'learning-goals',
      component: LearningGoalsPage
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/pages/stats/StatsPage.vue')
    }
  ]
})

export default router
