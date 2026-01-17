<script setup lang="ts">
import { Shuffle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { loadLearningContent } from '@/entities/learning-content/learningContentStore'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()

const props = defineProps<{
  currentId: string
}>()

const handleClose = () => {
  router.push('/learning-content')
}

const handleOpenRandom = async () => {
  const all = await loadLearningContent()
  const withoutFlashcards = all.filter(
    (item) => item.id !== props.currentId && (!item.relatedFlashcards || item.relatedFlashcards.length === 0)
  )

  if (withoutFlashcards.length === 0) {
    showToast('No learning content without flashcards found', 'info')
    return
  }

  const random = withoutFlashcards[Math.floor(Math.random() * withoutFlashcards.length)]
  router.push(`/learning-content/${random.id}/edit`)
}
</script>

<template>
  <div class="flex gap-2">
    <button class="btn" @click="handleClose">
      Close
    </button>
    <button class="btn" @click="handleOpenRandom">
      <Shuffle :size="16" />
      Random without flashcards
    </button>
  </div>
</template>
