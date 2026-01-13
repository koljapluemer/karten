<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import { createLearningContent, updateLearningContent } from '@/entities/learning-content/learningContentStore'

const router = useRouter()
const content = ref('')
const relatedFlashcards = ref<string[]>([])
const createdId = ref<string | null>(null)

const handleBlur = async () => {
  if (!createdId.value) {
    const item = await createLearningContent(content.value, relatedFlashcards.value)
    createdId.value = item.id
  } else {
    await updateLearningContent(createdId.value, content.value, relatedFlashcards.value)
  }
}

const handleClose = () => {
  router.push('/learning-content')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Add Learning Content
    </h1>

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
</template>
