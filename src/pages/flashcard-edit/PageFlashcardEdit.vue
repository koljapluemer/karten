<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import FlashcardFormEdit from '@/entities/flashcard/FlashcardFormEdit.vue'
import SaveIndicator from '@/dumb/SaveIndicator.vue'
import { useAutoSave } from '@/dumb/useAutoSave'
import { getFlashcardById, updateFlashcard, deleteFlashcard, loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningContent, updateLearningContent } from '@/entities/learning-content/learningContentStore'
import { cleanupOrphanedMedia } from '@/entities/media/mediaCleanup'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
import { db } from '@/db/db'
import type { LearningProgress } from '@/db/LearningProgress'
import type { LearningContent } from '@/db/LearningContent'
import type { Tag } from '@/db/Tag'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()

const front = ref('')
const back = ref('')
const blockedBy = ref<string[]>([])
const tags = ref<string[]>([])
const frontMediaIds = ref<string[]>([])
const backMediaIds = ref<string[]>([])
const allTags = ref<Tag[]>([])
const notFound = ref(false)
const learningProgress = ref<LearningProgress | null>(null)
const relatedLearningContent = ref<LearningContent[]>([])

const stateLabel = computed(() => {
  if (!learningProgress.value) return ''
  const state = learningProgress.value.state
  if (state === 0) return 'New'
  if (state === 1) return 'Learning'
  if (state === 2) return 'Review'
  if (state === 3) return 'Relearning'
  return 'Unknown'
})

const dueDate = computed(() => {
  if (!learningProgress.value) return ''
  return new Date(learningProgress.value.due).toLocaleDateString()
})

const lastReviewDate = computed(() => {
  if (!learningProgress.value?.last_review) return 'Never'
  return new Date(learningProgress.value.last_review).toLocaleDateString()
})

onMounted(async () => {
  const id = route.params.id as string
  try {
    allTags.value = await loadTags()
    const flashcard = await getFlashcardById(id)
    front.value = flashcard.front
    back.value = flashcard.back
    blockedBy.value = flashcard.blockedBy ?? []
    tags.value = flashcard.tags ?? []
    frontMediaIds.value = flashcard.frontMediaIds ?? []
    backMediaIds.value = flashcard.backMediaIds ?? []
    notFound.value = false

    const progressId = id.replace('flashcard:', 'learning-progress:')
    learningProgress.value = await db.learningProgress.get(progressId) || null

    // Load related learning content
    const allContent = await loadLearningContent()
    relatedLearningContent.value = allContent.filter(lc =>
      lc.relatedFlashcards.includes(id)
    )

    // Handle auto-attach of newly created prerequisite flashcard
    const createdId = route.query.createdId as string
    if (createdId && !blockedBy.value.includes(createdId)) {
      blockedBy.value = [...blockedBy.value, createdId]
      await updateFlashcard(id, front.value, back.value, blockedBy.value, tags.value, frontMediaIds.value, backMediaIds.value)
      showToast('Prerequisite flashcard attached', 'success')

      // Clean URL by removing createdId param
      const cleanUrl = new URL(route.fullPath, window.location.origin)
      cleanUrl.searchParams.delete('createdId')
      router.replace(cleanUrl.pathname + cleanUrl.search)
    }
  } catch {
    notFound.value = true
  }
})

const save = async () => {
  const id = route.params.id as string
  if (!id) return
  await updateFlashcard(id, front.value, back.value, blockedBy.value, tags.value, frontMediaIds.value, backMediaIds.value)
}

const { status } = useAutoSave([front, back, blockedBy, tags, frontMediaIds, backMediaIds], save)

const handleCreateTag = async (content: string) => {
  const tag = await getOrCreateTag(content)
  allTags.value = await loadTags()
  tags.value = [...tags.value, tag.id]
}

const handleClose = () => {
  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
}

const handleDelete = async () => {
  const id = route.params.id as string
  if (!confirm('Delete this flashcard?')) return

  // Remove from learning content's relatedFlashcards
  for (const lc of relatedLearningContent.value) {
    const updatedRelated = lc.relatedFlashcards.filter(fcId => fcId !== id)
    await updateLearningContent(lc.id, lc.content, updatedRelated, lc.tags ?? [])
  }

  // Remove from other flashcards' blockedBy arrays
  const allFlashcards = await loadFlashcards()
  for (const fc of allFlashcards) {
    if (fc.blockedBy.includes(id)) {
      const updatedBlockedBy = fc.blockedBy.filter(blockedId => blockedId !== id)
      await updateFlashcard(fc.id, fc.front, fc.back, updatedBlockedBy, fc.tags ?? [])
    }
  }

  // Collect media IDs for cleanup
  const mediaToCleanup = [...frontMediaIds.value, ...backMediaIds.value]

  // Delete the flashcard
  await deleteFlashcard(id)

  // Cleanup orphaned media
  await cleanupOrphanedMedia(mediaToCleanup)
  showToast('Flashcard deleted', 'success')

  // Navigate back
  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">
        Edit Flashcard
      </h1>
      <SaveIndicator :status="status" />
    </div>

    <div v-if="notFound">
      <p>Flashcard not found.</p>
      <button
        class="btn btn-outline mt-4"
        @click="handleClose"
      >
        Back
      </button>
    </div>

    <div v-else>
      <FlashcardFormEdit
        v-model:front="front"
        v-model:back="back"
        v-model:blocked-by="blockedBy"
        v-model:tags="tags"
        v-model:front-media-ids="frontMediaIds"
        v-model:back-media-ids="backMediaIds"
        :all-tags="allTags"
        @create-tag="handleCreateTag"
      />

      <div
        v-if="learningProgress"
        class="card shadow mt-4"
      >
        <div class="card-body">
          <h3 class="card-title text-sm">
            Learning Stats
          </h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-light">State:</span> {{ stateLabel }}
            </div>
            <div>
              <span class="text-light">Difficulty:</span> {{ learningProgress.difficulty.toFixed(2) }}
            </div>
            <div>
              <span class="text-light">Stability:</span> {{ learningProgress.stability.toFixed(1) }} days
            </div>
            <div>
              <span class="text-light">Reviews:</span> {{ learningProgress.reps }}
            </div>
            <div>
              <span class="text-light">Lapses:</span> {{ learningProgress.lapses }}
            </div>
            <div>
              <span class="text-light">Due:</span> {{ dueDate }}
            </div>
            <div>
              <span class="text-light">Last review:</span> {{ lastReviewDate }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="relatedLearningContent.length > 0"
        class="card shadow mt-4"
      >
        <div class="card-body">
          <h3 class="card-title text-sm">
            Related Learning Content
          </h3>
          <ul class="list-disc list-inside text-sm">
            <li
              v-for="lc in relatedLearningContent"
              :key="lc.id"
            >
              <router-link
                :to="`/learning-content/${lc.id}/edit?returnTo=${encodeURIComponent(route.fullPath)}`"
                class="link link-primary"
              >
                {{ lc.content.substring(0, 60) }}{{ lc.content.length > 60 ? '...' : '' }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button
          class="btn btn-outline"
          @click="handleClose"
        >
          Close
        </button>
        <button
          class="btn btn-error btn-outline"
          @click="handleDelete"
        >
          <Trash2 :size="16" />
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
