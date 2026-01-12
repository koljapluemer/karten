<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import { getLearningContentById, updateLearningContent } from '@/entities/learning-content/learningContentStore'

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
