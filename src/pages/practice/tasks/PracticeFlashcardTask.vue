<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'done', payload: { score: number }): void
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
const answeredScore = ref(0)
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

const handleAnswer = async (score: number) => {
  if (!card.value || isSaving.value) return
  isSaving.value = true
  try {
    const now = new Date().toISOString()
    await progressStore.updateDeclarativeProgress(card.value._id, score, now)
    await flashcardsStore.addLog(card.value._id, 'PRACTICED_FLASHCARD', now)
    answeredScore.value = score
    hasAnswered.value = true
  } finally {
    isSaving.value = false
  }
}

const handleDone = () => {
  emit('done', { score: answeredScore.value })
}

onBeforeUnmount(() => {
  if (flipTimer.value) window.clearTimeout(flipTimer.value)
})
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <PracticeInstruction text="Remember & Reveal" />

    <div
      v-if="card"
      class="w-full"
    >
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :card-type="card.cardType"
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
      <div class="text-sm opacity-70">
        Did you remember correctly?
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0)"
        >
          No
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0.6)"
        >
          Kind Of
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(0.8)"
        >
          Yes
        </button>
        <button
          class="btn btn-outline"
          :disabled="isSaving"
          @click="handleAnswer(1)"
        >
          Easily
        </button>
      </div>
    </div>

    <ActionButtonRow
      v-if="hasAnswered"
      :actions="[{ id: 'next', label: 'Next', variant: 'primary' }]"
      @select="handleDone"
    />
  </div>
</template>
