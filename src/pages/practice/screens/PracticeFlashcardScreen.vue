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
  (event: 'next'): void
  (event: 'followup'): void
  (event: 'overlap'): void
  (event: 'required'): void
}>()

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()

const card = computed(() =>
  flashcardsStore.flashcards.find((entry) => entry._id === props.cardId)
)

const isRevealed = ref(false)
const isFlipping = ref(false)
const isSaving = ref(false)
const lastAnswer = ref<'no' | 'kindof' | 'yes' | 'easily' | null>(null)
const flipTimer = ref<number | null>(null)

const showBack = computed(() => isRevealed.value)

type ActionOption = { id: string; label: string; variant?: 'primary' | 'outline' | 'ghost' }

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
    lastAnswer.value = label
  } finally {
    isSaving.value = false
  }
}

const postActions = computed<ActionOption[]>(() => {
  if (!lastAnswer.value) return []
  if (lastAnswer.value === 'easily') {
    return [
      { id: 'followup', label: 'Add Follow-Up Flashcard', variant: 'primary' },
      { id: 'next', label: 'Next', variant: 'outline' }
    ]
  }
  if (lastAnswer.value === 'yes') {
    return [
      { id: 'overlap', label: 'Add Overlapping Flashcards', variant: 'primary' },
      { id: 'next', label: 'Next', variant: 'outline' }
    ]
  }
  return [
    { id: 'required', label: 'Add Required Flashcards', variant: 'primary' },
    { id: 'overlap', label: 'Add Overlapping Flashcards', variant: 'outline' },
    { id: 'next', label: 'Next', variant: 'outline' }
  ]
})

const handlePostAction = (id: string) => {
  if (id === 'followup') emit('followup')
  else if (id === 'overlap') emit('overlap')
  else if (id === 'required') emit('required')
  else emit('next')
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
        class="btn "
        @click="handleReveal"
      >
        Reveal
      </button>
    </div>

    <div
      v-else-if="card && !lastAnswer"
      class="space-y-3"
    >
      <div class="text-sm opacity-70">
        Did you remember correctly?
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          class="btn "
          :disabled="isSaving"
          @click="handleAnswer(0, 'no')"
        >
          No
        </button>
        <button
          class="btn "
          :disabled="isSaving"
          @click="handleAnswer(0.6, 'kindof')"
        >
          Kind Of
        </button>
        <button
          class="btn "
          :disabled="isSaving"
          @click="handleAnswer(0.8, 'yes')"
        >
          Yes
        </button>
        <button
          class="btn "
          :disabled="isSaving"
          @click="handleAnswer(1, 'easily')"
        >
          Easily
        </button>
      </div>
    </div>

    <ActionButtonRow
      v-if="postActions.length"
      :actions="postActions"
      @select="handlePostAction"
    />
  </div>
</template>
