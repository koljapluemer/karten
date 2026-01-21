<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import SaveIndicator from '@/dumb/SaveIndicator.vue'
import { useAutoSave } from '@/dumb/useAutoSave'
import { createLearningContent, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
import { showToast } from '@/app/toast/toastStore'
import type { Tag } from '@/db/Tag'

const router = useRouter()
const route = useRoute()
const content = ref('')
const relatedFlashcards = ref<string[]>([])
const tags = ref<string[]>([])
const allTags = ref<Tag[]>([])
const createdId = ref<string | null>(null)

onMounted(async () => {
  allTags.value = await loadTags()

  // Prefill tags from query params
  const prefillTags = route.query.tags
  if (prefillTags) {
    if (Array.isArray(prefillTags)) {
      tags.value = prefillTags.filter((t): t is string => typeof t === 'string')
    } else if (typeof prefillTags === 'string') {
      tags.value = [prefillTags]
    }
  }
})

const createOrUpdate = async () => {
  if (!createdId.value) {
    if (!content.value.trim()) return
    const item = await createLearningContent(content.value, relatedFlashcards.value, tags.value)
    createdId.value = item.id
  } else {
    await updateLearningContent(createdId.value, content.value, relatedFlashcards.value, tags.value)
  }
}

const { status } = useAutoSave([content, relatedFlashcards, tags], createOrUpdate)

const handleCreateTag = async (tagContent: string) => {
  const tag = await getOrCreateTag(tagContent)
  allTags.value = await loadTags()
  tags.value = [...tags.value, tag.id]
}

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

  const query: Record<string, string | string[]> = {}
  if (tags.value.length > 0) {
    query.tags = tags.value
  }
  router.push({ path: '/learning-content/add', query })
  // Reset form state for the new entry
  content.value = ''
  relatedFlashcards.value = []
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
      v-model:tags="tags"
      :all-tags="allTags"
      @create-tag="handleCreateTag"
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
