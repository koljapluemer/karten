<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'answered', payload: { score: number; label: 'no' | 'kindof' | 'yes' | 'easily' }): void
}>()

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()

const card = computed(() =>
  flashcardsStore.flashcards.find((entry) => entry._id === props.cardId)
)

const isRevealed = ref(false)
const isFlipping = ref(false)
const isSaving = ref(false)
const hasAnswered = ref(false)
const flipTimer = ref<number | null>(null)

const showBack = computed(() => isRevealed.value)

const handleReveal = () => {
  isRevealed.value = true
  isFlipping.value = true
  if (flipTimer.value) window.clearTimeout(flipTimer.value)
  flipTimer.value = window.setTimeout(() => {
    isFlipping.value = false
  }, 400)
}

const handleAnswer = async (score: number, label: 'no' | 'kindof' | 'yes' | 'easily') => {
  if (!card.value || isSaving.value) return
  isSaving.value = true
  try {
    const now = new Date().toISOString()
    await progressStore.updateDeclarativeProgress(card.value._id, score, now)
    await flashcardsStore.addLog(card.value._id, 'PRACTICED_FLASHCARD', now)
    hasAnswered.value = true
    emit('answered', { score, label })
  } finally {
    isSaving.value = false
  }
}

onBeforeUnmount(() => {
  if (flipTimer.value) window.clearTimeout(flipTimer.value)
})
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <div
      v-if="card"
      class="w-full"
    >
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :card-type="card.cardType"
        :instruction="card.instruction"
        :show-back="showBack"
        :flipped="isFlipping"
      />
    </div>

    <div
      v-if="card && !showBack"
      class="flex justify-end"
    >
      <button
        class="btn btn-primary"
        @click="handleReveal"
      >
        Reveal
      </button>
    </div>

    <div
      v-else-if="card && !hasAnswered"
      class="space-y-3"
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0, 'no')"
        >
          No
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0.6, 'kindof')"
        >
          Kind Of
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0.8, 'yes')"
        >
          Yes
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(1, 'easily')"
        >
          Easily
        </button>
      </div>
    </div>
  </div>
</template>
