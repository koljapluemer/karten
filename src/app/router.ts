import { createRouter, createWebHistory } from 'vue-router'
import PracticePage from '@/pages/practice/PracticePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'practice',
      component: PracticePage
    }
  ]
})

export default router
