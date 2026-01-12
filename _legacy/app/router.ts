import { createRouter, createWebHistory } from 'vue-router'
import TopicPracticePage from '@/pages/practice/TopicPracticePage.vue'
import TopicsPage from '@/pages/topics/TopicsPage.vue'
import TopicManagePage from '@/pages/topics/TopicManagePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/topic-practice'
    },
    {
      path: '/topic-practice',
      name: 'topic-practice',
      component: TopicPracticePage
    },
    {
      path: '/topics',
      name: 'topics',
      component: TopicsPage
    },
    {
      path: '/topics/:id',
      name: 'topic-manage',
      component: TopicManagePage
    }
  ]
})

export default router
