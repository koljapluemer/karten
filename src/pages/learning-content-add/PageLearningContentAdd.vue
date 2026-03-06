<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import SaveIndicator from '@/dumb/SaveIndicator.vue'
import { useAutoSave } from '@/dumb/useAutoSave'
import { createLearningContent, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()
const content = ref('')
const relatedFlashcards = ref<string[]>([])
const mediaIds = ref<string[]>([])
const createdId = ref<string | null>(null)

const createOrUpdate = async () => {
  if (!createdId.value) {
    if (!content.value.trim()) return
    const item = await createLearningContent(content.value, relatedFlashcards.value, mediaIds.value)
    createdId.value = item.id
  } else {
    await updateLearningContent(createdId.value, content.value, relatedFlashcards.value, mediaIds.value)
  }
}

const { status } = useAutoSave([content, relatedFlashcards, mediaIds], createOrUpdate)

const handleSave = async () => {
  if (!content.value.trim()) {
    showToast('Content cannot be empty', 'error')
    return
  }
  await createOrUpdate()
  showToast('Learning content saved', 'success')
  router.push({ path: '/learning-content', query: route.query })
}

const handleCancel = () => {
  showToast('Cancelled', 'info')
  router.push({ path: '/learning-content', query: route.query })
}

const handleAddAnother = async () => {
  if (!content.value.trim()) {
    showToast('Content cannot be empty', 'error')
    return
  }
  await createOrUpdate()
  showToast('Learning content saved', 'success')
  router.push({ path: '/learning-content/add', query: route.query })
  // Reset form state for the new entry
  content.value = ''
  relatedFlashcards.value = []
  mediaIds.value = []
  createdId.value = null
}

</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">
        Add Learning Content
      </h1>
      <SaveIndicator
        v-if="createdId"
        :status="status"
      />
    </div>

    <LearningContentManager
      v-model:content="content"
      v-model:related-flashcards="relatedFlashcards"
      v-model:media-ids="mediaIds"
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
        @click="handleAddAnother"
      >
        Save & Add Another
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
