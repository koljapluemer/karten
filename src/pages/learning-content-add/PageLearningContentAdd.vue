<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import { createLearningContent } from '@/entities/learning-content/learningContentStore'

const router = useRouter()
const content = ref('')
const relatedFlashcards = ref<string[]>([])

const handleSave = async () => {
  await createLearningContent(content.value, relatedFlashcards.value)
  router.push('/learning-content')
}

const handleCancel = () => {
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
    />

    <div class="flex gap-2 mt-4">
      <button
        class="btn btn-primary"
        @click="handleSave"
      >
        Save
      </button>
      <button
        class="btn"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
