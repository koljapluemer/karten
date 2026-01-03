<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'

const props = defineProps<{
  card: FlashCardDoc
  position: number
  total: number
  isBusy: boolean
}>()

const emit = defineEmits<{
  (event: 'answered', score: number): void
}>()

const isRevealed = ref(false)
const isFlipping = ref(false)
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

const handleAnswer = (score: number) => {
  if (props.isBusy) return
  emit('answered', score)
  isRevealed.value = false
}

onBeforeUnmount(() => {
  if (flipTimer.value) window.clearTimeout(flipTimer.value)
})
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <div class="flex items-center justify-between text-sm opacity-70">
      <span>Flashcard</span>
      <span>{{ position }} / {{ total }}</span>
    </div>

    <div class="w-full">
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :show-back="showBack"
        :flipped="isFlipping"
      />
    </div>

    <div
      v-if="!showBack"
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
      v-else
      class="space-y-3"
    >
      <div class="text-sm opacity-70">
        Did you remember correctly?
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0)"
        >
          No
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0.6)"
        >
          Kind Of
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0.8)"
        >
          Yes
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(1)"
        >
          Easily
        </button>
      </div>
    </div>
  </div>
</template>
