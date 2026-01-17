<script setup lang="ts">
import { Shuffle, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { loadLearningContent, deleteLearningContent } from '@/entities/learning-content/learningContentStore'
import { showToast } from '@/app/toast/toastStore'
import { pickRandom } from '@/dumb/random'

const router = useRouter()

const props = defineProps<{
  currentId: string
}>()

const handleClose = () => {
  router.push('/learning-content')
}

const handleDelete = async () => {
  if (!confirm('Delete this learning content?')) return
  await deleteLearningContent(props.currentId)
  showToast('Learning content deleted', 'info')
  router.push('/learning-content')
}

const handleOpenRandom = async () => {
  const all = await loadLearningContent()
  const withoutFlashcards = all.filter(
    (item) => item.id !== props.currentId && (!item.relatedFlashcards || item.relatedFlashcards.length === 0)
  )

  const random = pickRandom(withoutFlashcards)
  if (!random) {
    showToast('No learning content without flashcards found', 'info')
    return
  }

  router.push(`/learning-content/${random.id}/edit`)
}
</script>

<template>
  <div class="flex gap-2">
    <button class="btn" @click="handleClose">
      Close
    </button>
    <button class="btn" @click="handleOpenRandom">
      <Shuffle  />
      Random without flashcards
    </button>
    <button class="btn" @click="handleDelete">
      <Trash2  />
      Delete
    </button>
  </div>
</template>
