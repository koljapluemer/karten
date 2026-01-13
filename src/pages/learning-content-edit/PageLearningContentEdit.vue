<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import { getLearningContentById, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()
const content = ref('')
const relatedFlashcards = ref<string[]>([])
const notFound = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  try {
    const item = await getLearningContentById(id)
    content.value = item.content
    relatedFlashcards.value = item.relatedFlashcards ?? []

    // Handle auto-attach of newly created flashcard
    const createdId = route.query.createdId as string
    const attachToParentId = route.query.attachToParentId as string

    if (createdId) {
      if (attachToParentId) {
        // Attach as prerequisite to a specific parent flashcard
        const parent = await getFlashcardById(attachToParentId)
        if (parent && !parent.blockedBy.includes(createdId)) {
          const updatedBlockedBy = [...parent.blockedBy, createdId]
          await updateFlashcard(attachToParentId, parent.front, parent.back, parent.instruction, updatedBlockedBy)
          showToast('Prerequisite flashcard attached', 'success')
        }
      } else if (!relatedFlashcards.value.includes(createdId)) {
        // Attach to main related flashcards
        relatedFlashcards.value = [...relatedFlashcards.value, createdId]
        await updateLearningContent(id, content.value, relatedFlashcards.value)
        showToast('Related flashcard attached', 'success')
      }

      // Clean URL by removing query params
      const cleanUrl = new URL(route.fullPath, window.location.origin)
      cleanUrl.searchParams.delete('createdId')
      cleanUrl.searchParams.delete('attachToParentId')
      router.replace(cleanUrl.pathname + cleanUrl.search)
    }
  } catch {
    notFound.value = true
  }
})

const handleBlur = async () => {
  const id = route.params.id as string
  await updateLearningContent(id, content.value, relatedFlashcards.value)
}

const handleClose = () => {
  router.push('/learning-content')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Edit Learning Content
    </h1>

    <div v-if="notFound">
      <p>Learning content not found.</p>
      <button
        class="btn mt-4"
        @click="handleClose"
      >
        Back to List
      </button>
    </div>

    <div v-else>
      <LearningContentManager
        v-model:content="content"
        v-model:related-flashcards="relatedFlashcards"
        @blur="handleBlur"
      />

      <div class="flex gap-2 mt-4">
        <button
          class="btn"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
