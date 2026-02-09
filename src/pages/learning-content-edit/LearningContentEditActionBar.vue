<script setup lang="ts">
import { Shuffle, Trash2 } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { loadLearningContent, deleteLearningContent, getLearningContentById } from '@/entities/learning-content/learningContentStore'
import { cleanupOrphanedMedia } from '@/entities/media/mediaCleanup'
import { showToast } from '@/app/toast/toastStore'
import { pickRandom } from '@/dumb/random'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  currentId: string
}>()

const handleClose = () => {
  router.push({ path: '/learning-content', query: route.query })
}

const handleDelete = async () => {
  if (!confirm('Delete this learning content?')) return
  let mediaToCleanup: string[] = []
  try {
    const item = await getLearningContentById(props.currentId)
    mediaToCleanup = item.mediaIds ?? []
  } catch {
    // Item may already be gone
  }
  await deleteLearningContent(props.currentId)
  await cleanupOrphanedMedia(mediaToCleanup)
  showToast('Learning content deleted', 'info')
  router.push({ path: '/learning-content', query: route.query })
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

  router.push({ path: `/learning-content/${random.id}/edit`, query: route.query })
}
</script>

<template>
  <div class="flex gap-2">
    <button
      class="btn"
      @click="handleClose"
    >
      Close
    </button>
    <button
      class="btn"
      @click="handleOpenRandom"
    >
      <Shuffle />
      Random without flashcards
    </button>
    <button
      class="btn"
      @click="handleDelete"
    >
      <Trash2 />
      Delete
    </button>
  </div>
</template>
