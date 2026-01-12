import { createRouter, createWebHistory } from 'vue-router'
import PageLearningContentList from '@/pages/learning-content-list/PageLearningContentList.vue'
import PageLearningContentAdd from '@/pages/learning-content-add/PageLearningContentAdd.vue'
import PageLearningContentEdit from '@/pages/learning-content-edit/PageLearningContentEdit.vue'
import PageFlashcardList from '@/pages/flashcard-list/PageFlashcardList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/learning-content'
    },
    {
      path: '/learning-content',
      name: 'learning-content-list',
      component: PageLearningContentList
    },
    {
      path: '/learning-content/add',
      name: 'learning-content-add',
      component: PageLearningContentAdd
    },
    {
      path: '/learning-content/:id/edit',
      name: 'learning-content-edit',
      component: PageLearningContentEdit
    },
    {
      path: '/flashcards',
      name: 'flashcard-list',
      component: PageFlashcardList
    }
  ]
})

export default router
