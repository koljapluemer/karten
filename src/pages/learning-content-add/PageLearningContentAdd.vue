<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import { createLearningContent, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
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

const handleBlur = async () => {
  if (!createdId.value) {
    const item = await createLearningContent(content.value, relatedFlashcards.value, tags.value)
    createdId.value = item.id
  } else {
    await updateLearningContent(createdId.value, content.value, relatedFlashcards.value, tags.value)
  }
}

const handleCreateTag = async (tagContent: string) => {
  const tag = await getOrCreateTag(tagContent)
  allTags.value = await loadTags()
  tags.value = [...tags.value, tag.id]
  await handleBlur()
}

const handleClose = () => {
  router.push('/learning-content')
}

const handleAddAnother = () => {
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
    <h1 class="text-2xl font-bold mb-4">
      Add Learning Content
    </h1>

    <LearningContentManager
      v-model:content="content"
      v-model:related-flashcards="relatedFlashcards"
      v-model:tags="tags"
      :all-tags="allTags"
      @blur="handleBlur"
      @create-tag="handleCreateTag"
    />

    <div class="flex gap-2 mt-4">
      <button
        class="btn"
        @click="handleClose"
      >
        Close
      </button>
      <button
        class="btn"
        @click="handleAddAnother"
      >
        Add Another
      </button>
    </div>
  </div>
</template>
