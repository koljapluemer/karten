<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import SaveIndicator from '@/dumb/SaveIndicator.vue'
import { useAutoSave } from '@/dumb/useAutoSave'
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
  }
}

const save = async () => {
  if (!createdId.value) return
  await updateLearningContent(createdId.value, content.value, relatedFlashcards.value, tags.value)
}

const { status } = useAutoSave([content, relatedFlashcards, tags], save)

const handleCreateTag = async (tagContent: string) => {
  const tag = await getOrCreateTag(tagContent)
  allTags.value = await loadTags()
  tags.value = [...tags.value, tag.id]
}

const handleClose = () => {
  router.push({ path: '/learning-content', query: route.query })
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
