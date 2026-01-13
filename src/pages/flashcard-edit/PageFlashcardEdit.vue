<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FlashcardFormEdit from '@/entities/flashcard/FlashcardFormEdit.vue'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { db } from '@/app/storage/db'
import type { LearningProgress } from '@/app/storage/db'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()

const front = ref('')
const back = ref('')
const instruction = ref('')
const blockedBy = ref<string[]>([])
const notFound = ref(false)
const learningProgress = ref<LearningProgress | null>(null)

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
    const flashcard = await getFlashcardById(id)
    front.value = flashcard.front
    back.value = flashcard.back
    instruction.value = flashcard.instruction
    blockedBy.value = flashcard.blockedBy
    notFound.value = false

    const progressId = id.replace('flashcard:', 'learning-progress:')
    learningProgress.value = await db.learningProgress.get(progressId) || null

    // Handle auto-attach of newly created prerequisite flashcard
    const createdId = route.query.createdId as string
    if (createdId && !blockedBy.value.includes(createdId)) {
      blockedBy.value = [...blockedBy.value, createdId]
      await updateFlashcard(id, front.value, back.value, instruction.value, blockedBy.value)
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

const handleBlur = async () => {
  const id = route.params.id as string
  if (!id) return
  await updateFlashcard(id, front.value, back.value, instruction.value, blockedBy.value)
}

const handleClose = () => {
  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Edit Flashcard
    </h1>

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
        v-model:instruction="instruction"
        v-model:blocked-by="blockedBy"
        @blur="handleBlur"
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

      <div class="flex gap-2 mt-4">
        <button
          class="btn btn-outline"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
