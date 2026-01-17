<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LearningContentManager from '@/meta/learning-content-manage/LearningContentManager.vue'
import LearningContentEditActionBar from './LearningContentEditActionBar.vue'
import { getLearningContentById, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
import { showToast } from '@/app/toast/toastStore'
import type { Tag } from '@/db/Tag'

const router = useRouter()
const route = useRoute()
const content = ref('')
const relatedFlashcards = ref<string[]>([])
const tags = ref<string[]>([])
const allTags = ref<Tag[]>([])
const notFound = ref(false)

const loadContent = async (id: string) => {
  notFound.value = false
  try {
    allTags.value = await loadTags()
    const item = await getLearningContentById(id)
    content.value = item.content
    relatedFlashcards.value = item.relatedFlashcards ?? []
    tags.value = item.tags ?? []

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
}

watch(
  () => route.params.id as string,
  (id) => loadContent(id),
  { immediate: true }
)

const handleBlur = async () => {
  const id = route.params.id as string
  await updateLearningContent(id, content.value, relatedFlashcards.value, tags.value)
}

const handleCreateTag = async (tagContent: string) => {
  const tag = await getOrCreateTag(tagContent)
  allTags.value = await loadTags()
  tags.value = [...tags.value, tag.id]
  await handleBlur()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Edit Learning Content
    </h1>

    <div v-if="notFound">
      <p>Learning content not found.</p>
      <LearningContentEditActionBar :current-id="($route.params.id as string)" class="mt-4" />
    </div>

    <div v-else class="flex flex-col gap-4">
      <LearningContentEditActionBar :current-id="($route.params.id as string)" />

      <LearningContentManager
        v-model:content="content"
        v-model:related-flashcards="relatedFlashcards"
        v-model:tags="tags"
        :all-tags="allTags"
        @blur="handleBlur"
        @create-tag="handleCreateTag"
      />

      <LearningContentEditActionBar :current-id="($route.params.id as string)" />
    </div>
  </div>
</template>
